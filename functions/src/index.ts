import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';
import * as https from 'https';

// Initialize the default admin SDK app (for bervos-official)
admin.initializeApp({
  storageBucket: 'bervos-official.firebasestorage.app'
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// In-memory registry of dynamic Firebase Admin apps to avoid duplication
const initializedApps = new Map<string, admin.app.App>();

/**
 * Gets or initializes a Firebase Admin App for a specific project.
 */
function getProjectApp(projectId: string): admin.app.App | null {
  if (projectId === 'bervos-official') {
    return admin.app();
  }
  if (initializedApps.has(projectId)) {
    return initializedApps.get(projectId)!;
  }

  const projectsConfig = process.env.PROJECTS_SERVICE_ACCOUNT_CONFIG;
  if (!projectsConfig) {
    console.warn(`[Config] FIREBASE_PROJECTS_CONFIG env variable not set. Using fallback for ${projectId}.`);
    return null;
  }

  try {
    const configMap = JSON.parse(projectsConfig);
    const serviceAccount = configMap[projectId];
    if (!serviceAccount) {
      console.warn(`[Config] Service account key for project ${projectId} not found in FIREBASE_PROJECTS_CONFIG.`);
      return null;
    }

    const firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    }, projectId);

    initializedApps.set(projectId, firebaseApp);
    return firebaseApp;
  } catch (err) {
    console.error(`[Config] Failed to initialize admin app for project ${projectId}:`, err);
    return null;
  }
}

/**
 * Express middleware to restrict access to Google Logged-in user laresbernardo@gmail.com
 */
const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    (req as any).user = { email: 'laresbernardo@gmail.com' };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.email !== 'laresbernardo@gmail.com') {
      res.status(403).json({ error: 'Forbidden: Access restricted to laresbernardo@gmail.com only' });
      return;
    }
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Helper to parse JSON-LD from HTML
 */
function parseJsonLdFromHtml(htmlContent: string): any[] {
  const match = htmlContent.match(/<script type="application\/ld\+json" id="schema-jsonld">([\s\S]*?)<\/script>/);
  if (!match || !match[1]) {
    console.warn('[Parser] No JSON-LD script found in html.');
    return [];
  }

  try {
    const parsed = JSON.parse(match[1].trim());
    const graph = parsed['@graph'] || [];
    return graph.filter((item: any) =>
      item['@type'] === 'SoftwareApplication' || item['@type'] === 'SoftwareSourceCode'
    );
  } catch (err) {
    console.error('[Parser] JSON-LD parse failed:', err);
    return [];
  }
}

/**
 * Parses and returns the list of initiatives from index.html.
 * Falls back to fetching bervos.org if local filesystem file is missing.
 */
async function getInitiativesFromSchema(): Promise<any[]> {
  const pathsToTry = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.join(__dirname, '..', '..', 'index.html'),
    path.join(__dirname, '..', '..', 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html')
  ];

  let htmlContent = '';
  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        htmlContent = fs.readFileSync(p, 'utf8');
        console.log(`[Parser] Successfully read index.html from: ${p}`);
        break;
      }
    } catch (err) {
      // Continue
    }
  }

  if (!htmlContent) {
    console.warn('[Parser] Could not find local index.html. Attempting live fetch...');
    try {
      const response = await fetch('https://bervos.org/');
      if (response.ok) {
        htmlContent = await response.text();
        console.log('[Parser] Fetched live html from bervos.org');
      }
    } catch (err) {
      console.error('[Parser] Fallback fetch failed:', err);
    }
  }

  return parseJsonLdFromHtml(htmlContent);
}

/**
 * Resolves Firebase Project ID from initiative metadata.
 */
function getProjectId(item: any): string {
  const name = item.name.toLowerCase();
  if (name === 'billio') return 'bilio-c70af';
  if (name === 'chessverse') return 'chessverse-demo';
  if (name === 'tripitdown') return 'tripidown';
  if (name === 'aura') return 'aura-bervos';
  if (name === 'scribo') return 'scribo-demo';
  if (name === 'laresdj') return 'laresdj-b9947';
  if (name === 'pinmage') return 'pinmage-billio';
  if (name === 'tonaly') return 'tonaly-bervos';
  if (name === 'bervos') return 'bervos-official';
  // Dynamic fallback from domain name
  const match = item.url?.match(/https:\/\/([^.]+)\.bervos\.org/);
  return match ? match[1] : name;
}

interface UserMetrics {
  totalUsers: number;
  active30d: number;
}

/**
 * Counts Total Users and Active Users (logged in within last 30 days) via Firebase Auth
 */
async function getAppUserMetrics(app: admin.app.App): Promise<UserMetrics> {
  const authInstance = admin.auth(app);
  let active30d = 0;
  let totalUsers = 0;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let pageToken: string | undefined = undefined;

  try {
    do {
      const result: admin.auth.ListUsersResult = await authInstance.listUsers(1000, pageToken);
      totalUsers += result.users.length;
      for (const user of result.users) {
        const lastSignIn = user.metadata.lastSignInTime ? Date.parse(user.metadata.lastSignInTime) : 0;
        if (lastSignIn >= thirtyDaysAgo) {
          active30d++;
        }
      }
      pageToken = result.pageToken;
    } while (pageToken);
    return { totalUsers, active30d };
  } catch (err) {
    console.error('[Firebase] Failed to fetch user list for project:', err);
    return { totalUsers: 0, active30d: 0 };
  }
}

/**
 * Counts total telemetry downloads/file hits from Firestore collection 'telemetry' or 'downloads'
 */
async function getTelemetryHits(app: admin.app.App, projectId: string): Promise<number> {
  const db = admin.firestore(app);

  const appName = projectId === 'aura-bervos' ? 'aura' : projectId === 'pinmage-billio' ? 'pinmage' : '';
  if (appName) {
    try {
      const doc = await db.collection('stats').doc(appName).get();
      if (doc.exists) {
        return doc.data()?.download_count || 0;
      }
    } catch (err) {
      console.warn(`[Firestore] Failed to read doc stats/${appName} for ${projectId}:`, err);
    }
  }

  // Try querying 'telemetry' collection count first
  try {
    const telemetrySnap = await db.collection('telemetry').count().get();
    return telemetrySnap.data().count;
  } catch (err) {
    // Try fallback collection 'downloads'
    try {
      const downloadsSnap = await db.collection('downloads').count().get();
      return downloadsSnap.data().count;
    } catch (e) {
      // Try fallback collection 'metrics'
      try {
        const metricsSnap = await db.collection('metrics').count().get();
        return metricsSnap.data().count;
      } catch (x) {
        console.error('[Firebase] Failed to retrieve telemetry hits from Firestore:', x);
        return 0;
      }
    }
  }
}

function getCliRefreshToken(): string {
  try {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.tokens?.refresh_token || '';
    }
  } catch (e) { }
  return '';
}

async function getValidAccessToken(): Promise<string> {
  const refreshToken = getCliRefreshToken();
  if (!refreshToken) return '';

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 3000
    }, (res: any) => {
      let body = '';
      res.on('data', (chunk: any) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.access_token || '');
        } catch (e) {
          resolve('');
        }
      });
    });

    req.on('error', () => resolve(''));
    req.write(postData);
    req.end();
  });
}

async function getTelemetryHitsViaCli(projectId: string): Promise<number> {
  const token = await getValidAccessToken();
  if (!token) return 0;

  const getDoc = (url: string): Promise<any> => {
    return new Promise((resolve) => {
      https.get(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 3000
      }, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  };

  const appName = projectId === 'aura-bervos' ? 'aura' : projectId === 'pinmage-billio' ? 'pinmage' : '';
  if (appName) {
    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/stats/${appName}`;
    const docData = await getDoc(docUrl);
    if (docData && docData.fields && docData.fields.download_count) {
      return parseInt(docData.fields.download_count.integerValue || '0', 10);
    }
  }

  const runQuery = (collectionName: string): Promise<number> => {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          select: { fields: [] }
        }
      });
      const req = https.request({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 3000
      }, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            const arr = JSON.parse(body);
            const count = Array.isArray(arr) ? arr.filter((x: any) => x && x.document).length : 0;
            resolve(count);
          } catch (e) {
            resolve(0);
          }
        });
      });
      req.on('error', () => resolve(0));
      req.write(postData);
      req.end();
    });
  };

  const downloadsCount = await runQuery('downloads');
  if (downloadsCount > 0) return downloadsCount;

  const telemetryCount = await runQuery('telemetry');
  return telemetryCount;
}

async function getAppUserMetricsViaCli(projectId: string): Promise<UserMetrics> {
  const tempFile = path.join(os.tmpdir(), `users-${projectId}-${Date.now()}.json`);
  try {
    execSync(`npx firebase auth:export "${tempFile}" --format json --project ${projectId}`, { stdio: 'ignore', timeout: 8000 });
    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile, 'utf8').trim();
      try { fs.unlinkSync(tempFile); } catch (e) { }
      if (content) {
        const parsed = JSON.parse(content);
        const users = parsed.users || [];
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        let active30d = 0;
        for (const u of users) {
          const lastSignIn = u.lastSignedInAt ? parseInt(u.lastSignedInAt, 10) : 0;
          if (lastSignIn >= thirtyDaysAgo) {
            active30d++;
          }
        }
        return { totalUsers: users.length, active30d };
      }
    }
  } catch (err) {
    console.error(`[Local CLI Fallback] Failed to fetch users for project ${projectId}:`, err);
  }
  return { totalUsers: 0, active30d: 0 };
}

interface RepoMeta {
  version: string;
  releaseDate?: string;
}

interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

/**
 * Dynamic repository version and metadata extraction.
 * Support R DESCRIPTION (Version and Date keys) and Javascript package.json.
 * Searches both root directories and R/ directories across main and master branches.
 */
async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMeta> {
  const headers: any = { 'User-Agent': 'bervos-hub' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const paths = [
    'main/DESCRIPTION',
    'main/R/DESCRIPTION',
    'master/DESCRIPTION',
    'master/R/DESCRIPTION',
    'main/package.json',
    'master/package.json',
    'main/extension/manifest.json',
    'master/extension/manifest.json',
    'main/server/package.json',
    'master/server/package.json'
  ];

  for (const p of paths) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${p}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const text = await res.text();
        if (p.endsWith('package.json') || p.endsWith('manifest.json')) {
          const data = JSON.parse(text);
          if (data.version) {
            return { version: data.version };
          }
        } else {
          const vMatch = text.match(/^Version:\s*(\S+)/m);
          const dMatch = text.match(/^Date:\s*(\S+)/m);
          if (vMatch) {
            const result: RepoMeta = { version: vMatch[1] };
            if (dMatch) {
              // Parse date correctly and format it to ISO string
              result.releaseDate = new Date(dMatch[1]).toISOString();
            }
            return result;
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }

  return { version: '0.0.0' };
}

async function fetchBacklogFromRepo(owner: string, repo: string): Promise<{ count: number; content: string; updatedAt: string }> {
  const branches = ['main', 'master'];
  const token = process.env.GITHUB_TOKEN;

  function parseCount(content: string): number {
    return content.split('\n').filter(l => l.trim().startsWith('- ')).length;
  }

  function headerDate(res: Response): string {
    const lm = res.headers.get('last-modified');
    if (lm) {
      const d = new Date(lm);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    return '';
  }

  // 1. Try raw.githubusercontent.com (public repos)
  for (const branch of branches) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/BACKLOG.md`;
      const res = await fetch(url);
      if (res.ok) {
        const content = await res.text();
        let updatedAt = headerDate(res);
        // raw.githubusercontent.com doesn't return Last-Modified, so fallback to Commits API
        if (!updatedAt && token) {
          try {
            const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=BACKLOG.md&per_page=1&sha=${branch}`;
            const commitRes = await fetch(commitUrl, {
              headers: {
                'User-Agent': 'bervos-hub',
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (commitRes.ok) {
              const body = await commitRes.json();
              if (Array.isArray(body) && body.length > 0) {
                const date = body[0].commit?.committer?.date || body[0].commit?.author?.date || '';
                if (date) updatedAt = new Date(date).toISOString().split('T')[0];
              }
            }
          } catch (e) {
            console.warn(`[Backlog] Commits API failed for ${owner}/${repo}:`, e);
          }
        }
        return { count: parseCount(content), content, updatedAt };
      }
    } catch (err) {
      console.warn(`[Backlog] raw.githubusercontent.com failed for ${owner}/${repo} on ${branch}:`, err);
    }
  }

  if (!token) return { count: 0, content: '', updatedAt: '' };

  // 2. Try GitHub Contents API (private repos) with raw accept header
  for (const branch of branches) {
    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/BACKLOG.md?ref=${branch}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'bervos-hub',
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      });
      if (apiRes.ok) {
        const content = await apiRes.text();
        let updatedAt = headerDate(apiRes);
        console.log(`[Backlog] API response for ${owner}/${repo} on ${branch}: last-modified=${apiRes.headers.get('last-modified')}, updatedAt=${updatedAt}`);
        // If no last-modified header, fetch the commit date via Commits API
        if (!updatedAt) {
          try {
            const commitUrl = `https://api.github.com/repos/${owner}/${repo}/commits?path=BACKLOG.md&per_page=1&sha=${branch}`;
            const commitRes = await fetch(commitUrl, {
              headers: {
                'User-Agent': 'bervos-hub',
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            });
            if (commitRes.ok) {
              const body = await commitRes.json();
              console.log(`[Backlog] Commits API response for ${owner}/${repo} on ${branch}:`, JSON.stringify(body).slice(0, 500));
              if (Array.isArray(body) && body.length > 0) {
                const date = body[0].commit?.committer?.date || body[0].commit?.author?.date || '';
                if (date) updatedAt = new Date(date).toISOString().split('T')[0];
              }
            } else {
              console.warn(`[Backlog] Commits API returned ${commitRes.status} for ${owner}/${repo} on ${branch}`);
            }
          } catch (e) {
            console.warn(`[Backlog] Commits API failed for ${owner}/${repo}:`, e);
          }
        }
        return { count: parseCount(content), content, updatedAt };
      }
    } catch (err) {
      console.warn(`[Backlog] GitHub API failed for ${owner}/${repo} on ${branch}:`, err);
    }
  }

  return { count: 0, content: '', updatedAt: '' };
}

/**
 * lightweight HEAD request ping to calculate server latency
 */
async function pingServer(url: string): Promise<{ uptime: boolean; latency: number }> {
  const start = Date.now();
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const latency = Date.now() - start;
    return {
      uptime: response.ok,
      latency
    };
  } catch (err) {
    // Fallback to GET in case server rejects HEAD requests
    try {
      const response = await fetch(url, { method: 'GET' });
      const latency = Date.now() - start;
      return {
        uptime: response.ok,
        latency
      };
    } catch (e) {
      return {
        uptime: false,
        latency: Date.now() - start
      };
    }
  }
}

/**
 * Helper to dynamically scan sibling folders for actual package.json versions.
 */
function getLocalProjectVersion(projectName: string): string | null {
  const normalizedName = projectName.toLowerCase();
  const parentDir = path.join(__dirname, '..', '..', '..', '..');
  const directoryNames: Record<string, string> = {
    'billio': 'Billio',
    'chessverse': 'Chessverse',
    'tripitdown': 'tripitdown',
    'aura': 'Aura',
    'scribo': 'Scribo',
    'laresdj': 'LaresDJ.com',
    'pinmage': 'Pinmage',
    'tonaly': 'Tonaly',
    'yt2mp3': 'YT2MP3',
    'bervos': 'BERVOS.org'
  };

  const folderName = directoryNames[normalizedName] || projectName;
  const projectFolderPath = path.join(parentDir, folderName);

  if (!fs.existsSync(projectFolderPath)) {
    return null;
  }

  const packagePaths = [
    path.join(projectFolderPath, 'src', 'version.json'),
    path.join(projectFolderPath, 'package.json'),
    path.join(projectFolderPath, 'web', 'src', 'version.json'),
    path.join(projectFolderPath, 'web', 'package.json'),
    path.join(projectFolderPath, 'frontend', 'src', 'version.json'),
    path.join(projectFolderPath, 'frontend', 'package.json'),
    path.join(projectFolderPath, 'extension', 'manifest.json'),
    path.join(projectFolderPath, 'server', 'package.json')
  ];

  for (const p of packagePaths) {
    try {
      if (fs.existsSync(p)) {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (pkg.version) {
          return pkg.version;
        }
      }
    } catch (e) { }
  }

  if (normalizedName === 'aura' || normalizedName === 'pinmage') {
    const appDirName = normalizedName === 'aura' ? 'AuraApp' : 'PinmageApp';
    const plistPath = path.join(projectFolderPath, appDirName, 'Info.plist');
    try {
      if (fs.existsSync(plistPath)) {
        const content = fs.readFileSync(plistPath, 'utf8');
        const match = content.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
        if (match) return match[1];
      }
    } catch (e) { }
  }

  return null;
}

/**
 * Resolves the last 3 commits for a project.
 * If running locally and the sibling directory exists, reads from local git log.
 * Otherwise, fetches from the GitHub API if it is a public GitHub repository.
 */
async function getRepoCommits(projectName: string, repoUrl: string, limit = 15): Promise<GitCommit[]> {
  const normalizedName = projectName.toLowerCase();
  const parentDir = path.join(__dirname, '..', '..', '..', '..');
  const directoryNames: Record<string, string> = {
    'billio': 'Billio',
    'chessverse': 'Chessverse',
    'tripitdown': 'tripitdown',
    'aura': 'Aura',
    'scribo': 'Scribo',
    'laresdj': 'LaresDJ',
    'pinmage': 'Pinmage',
    'tonaly': 'Tonaly',
    'yt2mp3': 'YT2MP3',
    'bervos': 'BERVOS/BERVOS.org'
  };

  const folderName = directoryNames[normalizedName] || projectName;
  const projectFolderPath = path.join(parentDir, folderName);

  if (fs.existsSync(path.join(projectFolderPath, '.git'))) {
    try {
      // Get remote URL to generate commit links
      let commitUrlBase = '';
      try {
        const remoteUrl = execSync('git config --get remote.origin.url', { cwd: projectFolderPath, encoding: 'utf8', timeout: 1000 }).trim();
        if (remoteUrl) {
          let cleanUrl = remoteUrl;
          if (cleanUrl.startsWith('git@github.com:')) {
            cleanUrl = 'https://github.com/' + cleanUrl.substring(15);
          }
          if (cleanUrl.endsWith('.git')) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length - 4);
          }
          commitUrlBase = cleanUrl;
        }
      } catch (e) { }

      const stdout = execSync(
        `git log -n ${limit} --date=short --pretty=format:"%h__DELIM__%an__DELIM__%ad__DELIM__%aI__DELIM__%s"`,
        { cwd: projectFolderPath, encoding: 'utf8', timeout: 2000 }
      );
      return stdout.trim().split('\n').filter(Boolean).map(line => {
        const parts = line.split('__DELIM__');
        const hash = parts[0] || '';
        const author = parts[1] || '';
        const date = parts[2] || '';
        const isoDate = parts[3] || '';
        const message = parts.slice(4).join('__DELIM__') || '';
        return {
          hash: hash || '',
          author: author || '',
          date: date || '',
          message: message || '',
          timestamp: isoDate || '',
          commitUrl: commitUrlBase ? `${commitUrlBase}/commit/${hash}` : ''
        };
      });
    } catch (e) {
      console.warn(`[Local Git] Failed to execute git log for ${projectName}:`, e);
    }
  }

  let gitUrl = repoUrl;
  if (!gitUrl || !gitUrl.includes('github.com')) {
    const gitUrlMap: Record<string, string> = {
      'billio': 'https://github.com/laresbernardo/Billio.git',
      'chessverse': 'https://github.com/laresbernardo/Chessverse.git',
      'tripitdown': 'https://github.com/laresbernardo/tripitdown.git',
      'aura': 'https://github.com/laresbernardo/aura.git',
      'scribo': 'https://github.com/laresbernardo/Scribo.git',
      'laresdj': 'https://github.com/laresbernardo/laresdj.com.git',
      'pinmage': 'https://github.com/laresbernardo/pinmage',
      'tonaly': 'https://github.com/laresbernardo/tonaly',
      'yt2mp3': 'https://github.com/laresbernardo/YT2MP3.git',
      'bervos': 'https://github.com/laresbernardo/bervos.git'
    };
    gitUrl = gitUrlMap[normalizedName] || '';
  }

  if (gitUrl && gitUrl.includes('github.com')) {
    const match = gitUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match && match[1] && match[2]) {
      const owner = match[1];
      const repo = match[2].replace(/.git$/, '');
      const headers: any = { 'User-Agent': 'bervos-hub' };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return data.map((item: any) => {
              const commit = item.commit || {};
              const authorInfo = commit.author || {};
              const dateStr = authorInfo.date ? new Date(authorInfo.date).toISOString().split('T')[0] : '';
              return {
                hash: item.sha ? item.sha.substring(0, 7) : '',
                author: authorInfo.name || '',
                date: dateStr,
                timestamp: authorInfo.date || '',
                message: commit.message ? commit.message.split('\n')[0] : '',
                commitUrl: item.html_url || `https://github.com/${owner}/${repo}/commit/${item.sha}`
              };
            });
          }
        }
      } catch (err) {
        console.error(`[GitHub API] Failed to fetch commits for ${owner}/${repo}:`, err);
      }
    }
  }

  return [];
}

/**
 * Fetches metrics for a single initiative item.
 */
async function fetchInitiativeMetrics(item: any): Promise<any> {
  const id = item['@id'];
  const type = item['@type'];
  const name = item.name;
  const url = item.url || item.codeRepository;

  console.log(`[Fetcher] Fetching metrics for: ${name} (${type})`);

  const metrics: any = {
    id,
    name,
    type,
    url,
    description: item.description,
    timestamp: new Date().toISOString()
  };

  // Calculate Uptime & Latency for all
  if (url) {
    const ping = await pingServer(url);
    metrics.uptime = ping.uptime;
    metrics.latency = ping.latency;
  } else {
    metrics.uptime = false;
    metrics.latency = 0;
  }

  if (type === 'SoftwareSourceCode') {
    // Open source repository
    const repoUrl = item.codeRepository || '';
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match && match[1] && match[2]) {
      const owner = match[1];
      const repo = match[2];
      const headers: Record<string, string> = { 'User-Agent': 'bervos-hub' };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      try {
        // Fetch repository statistics
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          metrics.stars = repoData.stargazers_count || 0;
          metrics.openIssues = repoData.open_issues_count || 0;
          metrics.lastUpdated = repoData.pushed_at || repoData.updated_at || '';
        } else {
          metrics.stars = 0;
          metrics.openIssues = 0;
          metrics.lastUpdated = '';
        }

        // Fetch package version and release date from DESCRIPTION/package.json
        const repoMeta = await fetchRepoMetadata(owner, repo);
        metrics.version = repoMeta.version;
        if (repoMeta.releaseDate) {
          metrics.lastUpdated = repoMeta.releaseDate;
        }
      } catch (err) {
        console.error(`[GitHub] Error fetching repo stats for ${name}:`, err);
        metrics.stars = 0;
        metrics.openIssues = 0;
        metrics.version = '0.0.0';
        metrics.lastUpdated = '';
      }
    }
  } else if (type === 'SoftwareApplication') {
    // Firebase Web App or Utility/Desktop app
    const projectId = getProjectId(item);
    const isUtility = item.applicationCategory === 'UtilitiesApplication';
    metrics.applicationCategory = item.applicationCategory;

    // Version: prefer local filesystem, then GitHub, then fallback
    const localVersion = getLocalProjectVersion(name);
    metrics.version = localVersion || '1.0.0';

    // Try GitHub for real version if local is unavailable
    if (!localVersion) {
      const normalizedName = name.toLowerCase();
      const gitUrlMap: Record<string, string> = {
        'billio': 'https://github.com/laresbernardo/Billio.git',
        'chessverse': 'https://github.com/laresbernardo/Chessverse.git',
        'tripitdown': 'https://github.com/laresbernardo/tripitdown.git',
        'aura': 'https://github.com/laresbernardo/aura.git',
        'scribo': 'https://github.com/laresbernardo/Scribo.git',
        'laresdj': 'https://github.com/laresbernardo/laresdj.com.git',
        'pinmage': 'https://github.com/laresbernardo/pinmage',
        'tonaly': 'https://github.com/laresbernardo/tonaly',
        'yt2mp3': 'https://github.com/laresbernardo/YT2MP3.git',
        'bervos': 'https://github.com/laresbernardo/bervos.git'
      };
      const repoUrl = item.codeRepository || gitUrlMap[normalizedName] || url || '';
      const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (repoMatch) {
        const owner = repoMatch[1];
        const repo = repoMatch[2];
        try {
          const repoMeta = await fetchRepoMetadata(owner, repo);
          if (repoMeta.version && repoMeta.version !== '0.0.0') {
            metrics.version = repoMeta.version;
            if (repoMeta.releaseDate) {
              metrics.lastUpdated = repoMeta.releaseDate;
            }
          }
        } catch (err) {
          console.error(`[GitHub] Error fetching repo metadata for ${name}:`, err);
        }
      }
    }

    const projectApp = getProjectApp(projectId);
    if (projectApp) {
      if (isUtility) {
        // Utility/Desktop App: Pull downloads/file hits
        metrics.downloads = await getTelemetryHits(projectApp, projectId);
      } else {
        // Web App with login: Pull MAU and unique users count
        const userMetrics = await getAppUserMetrics(projectApp);
        metrics.totalUsers = userMetrics.totalUsers;
        metrics.active30d = userMetrics.active30d;
      }
    } else {
      // Local CLI/REST Development Fallbacks
      if (isUtility) {
        metrics.downloads = await getTelemetryHitsViaCli(projectId);
      } else {
        const userMetrics = await getAppUserMetricsViaCli(projectId);
        metrics.totalUsers = userMetrics.totalUsers;
        metrics.active30d = userMetrics.active30d;
      }
      if (!localVersion && !item.codeRepository) {
        metrics.version = '0.0.0';
      }
    }
  }

  // Retrieve recent commits (prefer codeRepository for GitHub projects)
  const commitUrl = item.codeRepository || url;
  metrics.commits = await getRepoCommits(name, commitUrl);

  // Fetch BACKLOG.md count and content from GitHub repo
  const extractOwnerRepo = (u: string) => {
    if (!u || !u.includes('github.com')) return null;
    const m = u.match(/github\.com\/([^/]+)\/([^/]+?)(\.git|\/|$)/);
    return m && m[1] && m[2] ? { owner: m[1], repo: m[2] } : null;
  };

  let gh = extractOwnerRepo(item.codeRepository || url);

  if (!gh) {
    const n = name.toLowerCase();
    const backlogGitUrlMap: Record<string, string> = {
      'billio': 'https://github.com/laresbernardo/Billio.git',
      'chessverse': 'https://github.com/laresbernardo/Chessverse.git',
      'tripitdown': 'https://github.com/laresbernardo/tripitdown.git',
      'aura': 'https://github.com/laresbernardo/aura.git',
      'scribo': 'https://github.com/laresbernardo/Scribo.git',
      'laresdj': 'https://github.com/laresbernardo/laresdj.com.git',
      'pinmage': 'https://github.com/laresbernardo/pinmage',
      'tonaly': 'https://github.com/laresbernardo/tonaly',
      'yt2mp3': 'https://github.com/laresbernardo/YT2MP3.git',
      'bervos': 'https://github.com/laresbernardo/bervos.git'
    };
    gh = extractOwnerRepo(backlogGitUrlMap[n]);
  }

  if (gh) {
    const backlog = await fetchBacklogFromRepo(gh.owner, gh.repo);
    metrics.backlogCount = backlog.count;
    metrics.backlogContent = backlog.content;
    metrics.backlogUpdatedAt = backlog.updatedAt;
  } else {
    metrics.backlogCount = 0;
    metrics.backlogContent = '';
  }

  return metrics;
}

/**
 * Loops through initiatives and pulls real-time analytics
 */
async function fetchFreshMetrics(): Promise<any[]> {
  const initiatives = await getInitiativesFromSchema();
  return Promise.all(initiatives.map(item => fetchInitiativeMetrics(item)));
}

// Local cache configuration
const LOCAL_CACHE_PATH = path.join('/tmp', 'metrics-snapshot.json');

/**
 * Reads the cached metrics snapshot from Firestore or local file system.
 */
async function getCache(): Promise<{ timestamp: number; data: unknown[] } | null> {
  // 1. Try Firestore database cache first
  try {
    const db = admin.firestore();
    const doc = await db.collection('cache').doc('metrics').get();
    if (doc.exists) {
      const data = doc.data();
      if (data && data.timestamp && data.metrics) {
        console.log('[Cache] Cache hit from Firestore.');
        return {
          timestamp: data.timestamp,
          data: data.metrics
        };
      }
    }
  } catch (err) {
    console.warn('[Cache] Failed to read cache from Firestore. Trying local file...', err);
  }

  // 2. Try Local filesystem cache fallback
  try {
    if (fs.existsSync(LOCAL_CACHE_PATH)) {
      const content = fs.readFileSync(LOCAL_CACHE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed.timestamp && parsed.data) {
        console.log('[Cache] Cache hit from local temp file.');
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Cache] Failed to read local cache:', err);
  }

  return null;
}

/**
 * Saves metrics to the cache (Firestore & local file system)
 */
async function saveCache(data: unknown[]): Promise<void> {
  const timestamp = Date.now();
  const payload = { timestamp, data };

  // 1. Save to local file system
  try {
    fs.writeFileSync(LOCAL_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    console.log('[Cache] Saved local cache file.');
  } catch (err) {
    console.error('[Cache] Failed to write local cache file:', err);
  }

  // 2. Save to Firestore
  try {
    const db = admin.firestore();
    await db.collection('cache').doc('metrics').set({
      timestamp,
      metrics: data
    });
    console.log('[Cache] Saved cache to Firestore.');
  } catch (err) {
    console.error('[Cache] Failed to write cache to Firestore:', err);
  }
}

app.get(['/commits', '/api/commits'], authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const projectName = req.query.project as string;
    const limit = parseInt(req.query.limit as string) || 15;
    if (!projectName) {
      res.status(400).json({ error: 'Missing project parameter' });
      return;
    }
    const initiatives = await getInitiativesFromSchema();
    const projectItem = initiatives.find(item =>
      item.name.toLowerCase() === projectName.toLowerCase()
    );
    if (!projectItem) {
      res.status(404).json({ error: `Project not found: ${projectName}` });
      return;
    }
    const url = projectItem.url || projectItem.codeRepository;
    const commitUrl = projectItem.codeRepository || url;
    const commits = await getRepoCommits(projectName, commitUrl, limit);
    res.json(commits);
  } catch (err) {
    console.error('[Commits API] Failed to fetch commits:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get(['/metrics', '/api/metrics'], authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const isRefresh = req.query.refresh === 'true';
    const projectQuery = req.query.project as string;

    if (isRefresh && projectQuery) {
      console.log(`[SWR] Single project refresh requested for: ${projectQuery}`);
      const cached = await getCache();
      if (cached) {
        const initiatives = await getInitiativesFromSchema();
        const matchedInitiative = initiatives.find(item =>
          item.name.toLowerCase() === projectQuery.toLowerCase() ||
          item['@id'].toLowerCase() === projectQuery.toLowerCase() ||
          getProjectId(item).toLowerCase() === projectQuery.toLowerCase()
        );

        if (!matchedInitiative) {
          res.status(404).json({ error: `Project not found: ${projectQuery}` });
          return;
        }

        const freshProjectMetrics = await fetchInitiativeMetrics(matchedInitiative);

        let updated = false;
        const updatedData = cached.data.map((item: any) => {
          if (item.id === freshProjectMetrics.id || item.name.toLowerCase() === freshProjectMetrics.name.toLowerCase()) {
            updated = true;
            return freshProjectMetrics;
          }
          return item;
        });
        if (!updated) {
          updatedData.push(freshProjectMetrics);
        }

        await saveCache(updatedData);
        res.setHeader('X-Cache-Status', 'MISS');
        res.json(updatedData);
        return;
      }
    }

    const cached = !isRefresh ? await getCache() : null;
    const oneHour = 60 * 60 * 1000;

    if (cached) {
      const isExpired = Date.now() - cached.timestamp >= oneHour;

      if (!isExpired) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.json(cached.data);
        return;
      }

      // Cache is expired: Return stale data instantly, trigger background update
      res.setHeader('X-Cache-Status', 'STALE');
      res.json(cached.data);

      // Trigger background fetch asynchronously
      setTimeout(async () => {
        try {
          console.log('[SWR] Background update triggered...');
          const fresh = await fetchFreshMetrics();
          await saveCache(fresh);
          console.log('[SWR] Background update completed.');
        } catch (err) {
          console.error('[SWR] Background update failed:', err);
        }
      }, 0);
      return;
    }

    // No cache exists: fetch synchronously
    console.log('[SWR] No cache found. Fetching metrics synchronously...');
    const fresh = await fetchFreshMetrics();
    await saveCache(fresh);
    res.setHeader('X-Cache-Status', 'MISS');
    res.json(fresh);
  } catch (err) {
    console.error('[API] Unexpected error in /metrics endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) });
  }
});

app.get(['/public-metrics', '/api/public-metrics'], async (req: express.Request, res: express.Response) => {
  try {
    const cached = await getCache();
    if (cached && cached.data && Array.isArray(cached.data)) {
      const publicData = cached.data.map((m: any) => ({
        name: m.name,
        version: m.version || '1.0.0',
        stars: m.stars || 0,
        lastUpdated: m.lastUpdated || '',
        uptime: m.uptime !== undefined ? m.uptime : true
      }));
      res.setHeader('X-Cache-Status', 'HIT');
      res.json(publicData);
      return;
    }
    res.json([]);
  } catch (err) {
    console.error('[API] Unexpected error in /public-metrics endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

interface UserRecord {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastSignInTime?: string;
  createdAt?: string;
}

async function getAppUsers(app: admin.app.App): Promise<UserRecord[]> {
  const authInstance = admin.auth(app);
  const users: UserRecord[] = [];
  let pageToken: string | undefined = undefined;
  try {
    do {
      const result: admin.auth.ListUsersResult = await authInstance.listUsers(1000, pageToken);
      for (const user of result.users) {
        users.push({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastSignInTime: user.metadata.lastSignInTime || undefined,
          createdAt: user.metadata.creationTime || undefined,
        });
      }
      pageToken = result.pageToken;
    } while (pageToken);
    return users;
  } catch (err) {
    console.error('[Firebase] Failed to fetch users list for app:', err);
    return [];
  }
}

async function getAppUsersViaCli(projectId: string): Promise<UserRecord[]> {
  const tempFile = path.join(os.tmpdir(), `users-${projectId}-${Date.now()}.json`);
  try {
    execSync(`npx firebase auth:export "${tempFile}" --format json --project ${projectId}`, { stdio: 'ignore', timeout: 8000 });
    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile, 'utf8').trim();
      try { fs.unlinkSync(tempFile); } catch (e) { }
      if (content) {
        const parsed = JSON.parse(content);
        const cliUsers = parsed.users || [];
        return cliUsers.map((u: any) => ({
          uid: u.localId || u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoUrl || u.photoURL,
          lastSignInTime: u.lastSignedInAt ? (isFinite(Number(u.lastSignedInAt)) ? new Date(parseInt(u.lastSignedInAt, 10)).toISOString() : u.lastSignedInAt) : undefined,
          createdAt: u.createdAt ? (isFinite(Number(u.createdAt)) ? new Date(parseInt(u.createdAt, 10)).toISOString() : u.createdAt) : undefined,
        }));
      }
    }
  } catch (err) {
    console.error(`[Local CLI Fallback] Failed to fetch users for project ${projectId}:`, err);
  }
  return [];
}

async function fetchAllUsersAggregated(): Promise<Array<{
  email: string;
  displayName: string;
  photoURL: string;
  projects: string[];
  lastActive: string;
  firstActive: string;
  projectDetails: Record<string, { firstActive: string; lastActive: string }>;
}>> {
  const initiatives = await getInitiativesFromSchema();
  const allUsersMap = new Map<string, {
    email: string;
    displayName: string;
    photoURL: string;
    projects: string[];
    lastActive: string;
    firstActive: string;
    projectDetails: Record<string, { firstActive: string; lastActive: string }>;
  }>();

  for (const item of initiatives) {
    const type = item['@type'];
    const name = item.name;
    if (type === 'SoftwareApplication' && item.applicationCategory !== 'UtilitiesApplication') {
      const projectId = getProjectId(item);
      const projectApp = getProjectApp(projectId);

      let users: UserRecord[] = [];
      if (projectApp) {
        users = await getAppUsers(projectApp);
      } else {
        users = await getAppUsersViaCli(projectId);
      }

      // Local workspace backup file fallback (e.g. chessverse-users.json, scribo-users.json, etc.)
      if (users.length === 0) {
        const workspaceDir = path.join(__dirname, '..', '..');
        const normalizedName = name.toLowerCase();
        const backupFileName = `${normalizedName}-users.json`;
        const backupPath = path.join(workspaceDir, backupFileName);
        if (fs.existsSync(backupPath)) {
          try {
            const fileContent = fs.readFileSync(backupPath, 'utf8');
            const parsed = JSON.parse(fileContent);
            const backupUsers = parsed.users || [];
            users = backupUsers.map((u: any) => ({
              uid: u.localId || u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoUrl || u.photoURL,
              lastSignInTime: u.lastSignedInAt ? (isFinite(Number(u.lastSignedInAt)) ? new Date(parseInt(u.lastSignedInAt, 10)).toISOString() : u.lastSignedInAt) : undefined,
              createdAt: u.createdAt ? (isFinite(Number(u.createdAt)) ? new Date(parseInt(u.createdAt, 10)).toISOString() : u.createdAt) : undefined,
            }));
          } catch (err) {
            console.error(`[Backup Fallback] Failed to read backup file for ${name}:`, err);
          }
        }
      }

      for (const user of users) {
        if (!user.email) continue;
        const key = user.email.toLowerCase();
        const existing = allUsersMap.get(key);
        const lastActive = user.lastSignInTime || user.createdAt || '';
        const firstActive = user.createdAt || user.lastSignInTime || '';
        if (existing) {
          if (!existing.projects.includes(name)) {
            existing.projects.push(name);
          }
          if (lastActive && (!existing.lastActive || lastActive > existing.lastActive)) {
            existing.lastActive = lastActive;
          }
          if (firstActive && (!existing.firstActive || firstActive < existing.firstActive)) {
            existing.firstActive = firstActive;
          }
          if (!existing.displayName && user.displayName) {
            existing.displayName = user.displayName;
          }
          if (!existing.photoURL && user.photoURL) {
            existing.photoURL = user.photoURL;
          }
          if (!existing.projectDetails) {
            existing.projectDetails = {};
          }
          existing.projectDetails[name] = {
            firstActive: firstActive,
            lastActive: lastActive
          };
        } else {
          allUsersMap.set(key, {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            projects: [name],
            lastActive: lastActive,
            firstActive: firstActive,
            projectDetails: {
              [name]: {
                firstActive: firstActive,
                lastActive: lastActive
              }
            }
          });
        }
      }
    }
  }

  return Array.from(allUsersMap.values()).sort((a, b) => b.lastActive.localeCompare(a.lastActive));
}

app.get(['/users', '/api/users'], authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const aggregatedUsers = await fetchAllUsersAggregated();
    res.json(aggregatedUsers);
  } catch (err) {
    console.error('[API] Unexpected error in /users endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) });
  }
});


// ============================================================
// SOCIAL CONTENT MANAGEMENT API
// ============================================================

/**
 * GET /api/social — List all social posts from Firestore
 */
app.get('/api/social', authenticateAdmin, async (_req: express.Request, res: express.Response) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('social_posts').orderBy('suggested_date', 'asc').get();
    
    let facebookAccessToken = '';
    try {
      const creds = await getInstagramCredentials();
      facebookAccessToken = creds.access_token;
    } catch (_) {}

    const posts: any[] = [];
    const batch = db.batch();
    let hasUpdates = false;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.status === 'Published' && data.instagram_media_id && !data.instagram_permalink && facebookAccessToken) {
        try {
          const permalinkRes = await fetch(
            `https://graph.facebook.com/v19.0/${data.instagram_media_id}?fields=permalink&access_token=${facebookAccessToken}`
          );
          const permalinkData = await permalinkRes.json();
          if (permalinkRes.ok && permalinkData.permalink) {
            data.instagram_permalink = permalinkData.permalink;
            batch.update(doc.ref, { instagram_permalink: permalinkData.permalink });
            hasUpdates = true;
          }
        } catch (e) {
          console.warn(`[API] Could not heal permalink for post ${doc.id}:`, e);
        }
      }
      posts.push({ id: doc.id, ...data });
    }

    if (hasUpdates) {
      await batch.commit();
    }

    res.json(posts);
  } catch (err) {
    console.error('[API] Error fetching social posts:', err);
    res.status(500).json({ error: 'Failed to fetch social posts' });
  }
});

/**
 * PUT /api/social/:id — Update a social post (status, feedback, captions)
 */
app.put('/api/social/:id', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = admin.firestore();

    // Only allow specific fields to be updated
    const allowedFields = ['status', 'user_feedback', 'caption_english', 'caption_spanish', 'hook', 'visual_instruction', 'mermaid_code', 'suggested_date', 'screenshots', 'instagram_media_id', 'published_at', 'slides', 'instagram_scheduled_id', 'scheduled_at', 'instagram_permalink'];
    const filtered: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filtered[key] = updates[key];
      }
    }
    filtered['updated_at'] = new Date().toISOString();

    if (filtered.status === 'Published') {
      filtered.suggested_date = new Date().toISOString().split('T')[0];
    } else if (filtered.status === 'Draft' || filtered.status === 'Needs AI Revision') {
      filtered.suggested_date = '';
      filtered.scheduled_at = null;
    }

    // Process screenshots if provided
    if (updates.screenshots !== undefined && Array.isArray(updates.screenshots)) {
      const processedUrls: string[] = [];
      const base64ToUrlMap = new Map<string, string>();
      const bucket = admin.storage().bucket('bervos-official.firebasestorage.app');
      
      for (let i = 0; i < updates.screenshots.length; i++) {
        const item = updates.screenshots[i];
        if (typeof item === 'string' && item.startsWith('data:image/')) {
          const match = item.match(/^data:image\/(\w+);base64,(.+)$/);
          if (match) {
            const ext = match[1];
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, 'base64');
            // Store under social_posts/{id}/screenshot_{timestamp}_{index}.{ext}
            const fileName = `social_posts/${id}/screenshot_${Date.now()}_${i}.${ext}`;
            const file = bucket.file(fileName);
            await file.save(buffer, {
              metadata: { contentType: `image/${ext}` },
              public: true,
              resumable: false
            });
            await file.makePublic();
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            processedUrls.push(imageUrl);
            base64ToUrlMap.set(item, imageUrl);
          } else {
            processedUrls.push(item);
          }
        } else if (typeof item === 'string') {
          processedUrls.push(item);
        }
      }
      filtered['screenshots'] = processedUrls;

      // Map base64 strings in updates.slides to public URLs
      if (updates.slides !== undefined && Array.isArray(updates.slides)) {
        filtered['slides'] = updates.slides.map((slide: string) => {
          if (base64ToUrlMap.has(slide)) {
            return base64ToUrlMap.get(slide)!;
          }
          return slide;
        });
      }
    } else if (updates.slides !== undefined && Array.isArray(updates.slides)) {
      filtered['slides'] = updates.slides;
    }

    await db.collection('social_posts').doc(id).update(filtered);
    res.json({ success: true, id, updatedFields: filtered });
  } catch (err: any) {
    console.error('[API] Error updating social post:', err);
    res.status(500).json({ error: `Failed to update social post: ${err.message}` });
  }
});

/**
 * POST /api/social/import — Bulk import posts from JSON array
 */
app.post('/api/social/import', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const posts = req.body;
    if (!Array.isArray(posts)) {
      res.status(400).json({ error: 'Request body must be an array of posts' });
      return;
    }

    const db = admin.firestore();
    const batch = db.batch();
    let imported = 0;

    for (const post of posts) {
      if (!post.id) continue;
      const docRef = db.collection('social_posts').doc(post.id);
      batch.set(docRef, {
        ...post,
        updated_at: new Date().toISOString()
      }, { merge: true });
      imported++;
    }

    await batch.commit();
    res.json({ success: true, imported });
  } catch (err) {
    console.error('[API] Error importing social posts:', err);
    res.status(500).json({ error: 'Failed to import social posts' });
  }
});

const REPOS_FOR_PIPELINE = [
  { name: 'Billio', repo: 'laresbernardo/Billio' },
  { name: 'Aura', repo: 'laresbernardo/Aura' },
  { name: 'Pinmage', repo: 'laresbernardo/Pinmage' },
  { name: 'tripitdown', repo: 'laresbernardo/tripitdown' },
  { name: 'Chessverse', repo: 'laresbernardo/Chessverse' },
  { name: 'Scribo', repo: 'laresbernardo/Scribo' },
  { name: 'Tonaly', repo: 'laresbernardo/Tonaly' },
  { name: 'YT2MP3', repo: 'laresbernardo/YT2MP3' },
  { name: 'LaresDJ', repo: 'laresbernardo/LaresDJ' },
  { name: 'WAme', repo: 'laresbernardo/WAme' },
  { name: 'Relatos', repo: 'laresbernardo/relatos' },
  { name: 'BERVOS Hub', repo: 'laresbernardo/bervos' }
];

async function runSocialPipelineCore(): Promise<{ success: boolean; generated: number; posts: any[] }> {
  const db = admin.firestore();

  // Try local python execution first (for localhost:2000 environment)
  const scriptPath = path.join(process.cwd(), 'execution', 'generate_social_content.py');
  const scriptPathParent = path.join(__dirname, '..', 'execution', 'generate_social_content.py');
  const scriptToUse = fs.existsSync(scriptPath) ? scriptPath : (fs.existsSync(scriptPathParent) ? scriptPathParent : null);

  if (scriptToUse && process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log(`[Pipeline] Running local Python script at ${scriptToUse}...`);
    try {
      execSync(`python3 "${scriptToUse}"`, { stdio: 'inherit' });
      // Fetch latest generated posts from Firestore
      const snapshot = await db.collection('social_posts').orderBy('created_at', 'desc').limit(10).get();
      const posts = snapshot.docs.map(doc => doc.data());
      return { success: true, generated: posts.length, posts };
    } catch (err) {
      console.warn('[Pipeline] Local Python execution failed, falling back to Node Cloud pipeline:', err);
    }
  }

  // Cloud Production Pipeline via GitHub API + Gemini API
  console.log('[Pipeline] Running Cloud Generation Pipeline across all 12 projects...');
  const githubToken = process.env.GITHUB_TOKEN || '';
  const geminiKey = process.env.GEMINI_API_KEY || '';

  // 1. Fetch commits for each project from GitHub API
  const projectCommits: Record<string, string> = {};
  for (const item of REPOS_FOR_PIPELINE) {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'BERVOS-Hub-Pipeline'
      };
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      const ghRes = await fetch(`https://api.github.com/repos/${item.repo}/commits?per_page=100`, { headers });
      if (ghRes.ok) {
        const commitsData: any = await ghRes.json();
        if (Array.isArray(commitsData) && commitsData.length > 0) {
          const formatted = commitsData.slice(0, 100).map((c: any) => {
            const sha = c.sha?.substring(0, 7) || '';
            const msg = c.commit?.message?.split('\n')[0] || '';
            const date = c.commit?.committer?.date || '';
            return `${sha} - ${msg} (${date})`;
          }).join('\n');
          projectCommits[item.name] = formatted;
        }
      }
    } catch (err) {
      console.warn(`[Pipeline] Failed to fetch GitHub commits for ${item.name}:`, err);
    }
  }

  // 2. Fetch existing and discarded posts for deduplication
  const existingSnapshot = await db.collection('social_posts').get();
  const discardedSnapshot = await db.collection('discarded_posts').get();
  const existingPosts: any[] = [];
  existingSnapshot.docs.forEach(doc => {
    const data = doc.data();
    existingPosts.push({
      project: data.project,
      hook: data.hook,
      id: doc.id
    });
  });
  discardedSnapshot.docs.forEach(doc => {
    const data = doc.data();
    existingPosts.push({
      project: data.project || '',
      hook: data.hook || '',
      id: doc.id,
      discarded: true
    });
  });

  // 3. Construct Gemini Prompt
  const prompt = `You are Antigravity, a senior software engineer building the BERVOS ecosystem.
Your job is to draft 3-6 new Instagram posts from the recent engineering updates across the projects.
Follow these brand guidelines and structural rules strictly.

--- BRAND GUIDELINES & STYLE ---
1. Tone: Professional, direct, senior engineer discussing implementation, trade-offs, and metrics.
2. Absolutely NO AI marketing jargon: Do not use "Revolutionize," "Game-changer," "Unlock," "Supercharge," "Cutting-edge," "Empower," "Streamline," etc. Be concrete.
3. Language: Captions must be in English. At the very end of caption_english, add a clear, one-sentence Spanish summary as the caption_spanish field.
4. Structure:
   - Technical hook (1 line, attention-grabbing, no fluff)
   - Explain the "why" (problem context)
   - Frame the impact (efficiency / speed / scale / reliability)
   - End with a soft pointer to bervos.org or project site (e.g. bervos.org, tripitdown.bervos.org, etc.)
   - Include 3-5 relevant niche hashtags (e.g. #BuildInPublic, #IndieHacker, #React, #TypeScript, #SwiftUI, #LocalLLM, #Ollama, #MCPProtocol, #GeminiAPI)
5. Visual Directions:
   - Must specify brand prefix from guidelines for AI generated images:
     "Dark tech-aesthetic Instagram post for software engineering brand \\"BERVOS\\". Background: deep navy-black (#080b12). Accent colors: electric indigo (#6366f1) and cyan (#06b6d4) used sparingly for highlights, borders, and glow effects. Style: minimal, clean, HUD-inspired, no clutter. Typography: bold white sans-serif headlines, mono-spaced labels in indigo-300. No stock photos, no people, no hands. Professional and premium feel. Square format (1080x1080px)."
   - Include visual instructions for code screenshots (referencing Ray.so dark theme), architecture diagrams (using valid Mermaid.js flowcharts), or UI captures.
6. Post Formats:
   - Format A: "Before & After" Carousel (3 slides)
   - Format B: "Under the Hood" (Deep dive into technical architecture)
   - Format C: "Vibe Coding Reality" (Hurdle, design evolution, or testing phase)

--- DATA INPUT ---
Here is the JSON of existing posts in the queue to avoid repeating the exact same updates/hooks:
${JSON.stringify(existingPosts, null, 2)}

Here are the recent commit logs for the ecosystem projects:
${JSON.stringify(projectCommits, null, 2)}

--- TASK ---
Generate between 3 to 6 new, unique, and compelling social posts based on the recent commits that are not already covered in the existing posts.
Make sure you write posts for projects that are underrepresented (e.g., WAme, YT2MP3, tripitdown, Scribo, Aura, Billio, Pinmage, Relatos) using their latest updates.

Return a JSON array of post objects adhering to this schema:
[
  {
    "id": "unique-kebab-case-string-like-YYYYMMDD-project-topic",
    "status": "Draft",
    "post_type": "carousel_before_after" | "under_the_hood" | "vibe_coding_reality",
    "hook": "attention-grabbing first line",
    "caption_english": "Full English caption with paragraph spacing and 3-5 hashtags",
    "caption_spanish": "One-sentence Spanish summary",
    "visual_instruction": "Detailed visual layout instructions including the required BERVOS prompt prefix if generating an image",
    "mermaid_code": "valid Mermaid.js flowchart string (or null)",
    "suggested_date": "YYYY-MM-DD",
    "user_feedback": "",
    "project": "Project Name",
    "created_at": "ISO 8601 string (current time)",
    "updated_at": "ISO 8601 string (current time)"
  }
]
Do not include markdown code block formatting in your response. Return ONLY valid JSON.`;

  // 4. Try models in order: gemini-3.6-flash, gemini-3.5-flash, gemini-2.5-flash, gemini-1.5-flash
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  let generatedPosts: any[] = [];
  for (const modelName of modelsToTry) {
    try {
      console.log(`[Pipeline] Calling Gemini API model ${modelName}...`);
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData: any = await res.json();
        const textResult = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        generatedPosts = JSON.parse(textResult);
        console.log(`[Pipeline] Model ${modelName} returned ${generatedPosts.length} posts.`);
        break;
      } else {
        const errText = await res.text();
        console.warn(`[Pipeline] Model ${modelName} failed (${res.status}): ${errText.substring(0, 150)}`);
      }
    } catch (err) {
      console.warn(`[Pipeline] Error with model ${modelName}:`, err);
    }
  }

  if (!Array.isArray(generatedPosts) || generatedPosts.length === 0) {
    return { success: false, generated: 0, posts: [] };
  }

  // 5. Commit generated posts to Firestore
  const batch = db.batch();
  let count = 0;
  for (const post of generatedPosts) {
    if (post.id && post.project) {
      const docRef = db.collection('social_posts').doc(post.id);
      batch.set(docRef, post, { merge: true });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`[Pipeline] Successfully committed ${count} new posts to Firestore.`);
  }

  return { success: true, generated: count, posts: generatedPosts };
}

/**
 * POST /api/social/generate — Run AI pipeline to generate non-redundant posts across all 12 projects
 */
app.post('/api/social/generate', authenticateAdmin, async (_req: express.Request, res: express.Response) => {
  try {
    const result = await runSocialPipelineCore();
    res.json(result);
  } catch (err) {
    console.error('[API] Error running generation pipeline:', err);
    res.status(500).json({ error: 'Failed to run generation pipeline' });
  }
});

/**
 * POST /api/social/detect-email — Detect positions of laresbernardo@gmail.com to redact them
 */
app.post('/api/social/detect-email', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    // Extract mime type from base64 header if present, fallback to image/png
    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    // Strip out base64 header if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Identify all occurrences of the email address 'laresbernardo@gmail.com' (including substrings containing 'laresbernardo@gmail.com', such as 'GoogleDrive-laresbernardo@gmail.com') in the attached image.
Return a list of bounding boxes enclosing these occurrences. Each box should have:
- xmin: left edge of the bounding box (0-1000)
- ymin: top edge of the bounding box (0-1000)
- xmax: right edge of the bounding box (0-1000)
- ymax: bottom edge of the bounding box (0-1000)

The coordinates must be normalized to a 1000x1000 grid relative to the image size, where (0,0) represents the top-left corner and (1000,1000) represents the bottom-right corner.
Be extremely precise to ensure we can blur these exact regions.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              boxes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    xmin: { type: "NUMBER" },
                    ymin: { type: "NUMBER" },
                    xmax: { type: "NUMBER" },
                    ymax: { type: "NUMBER" }
                  },
                  required: ["xmin", "ymin", "xmax", "ymax"]
                }
              }
            },
            required: ["boxes"]
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Gemini API call failed: ${errText}` });
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      return res.json({ success: true, boxes: [] });
    }

    const resultObj = JSON.parse(textResult);
    return res.json({ success: true, boxes: resultObj.boxes || [] });
  } catch (err: any) {
    console.error('[Detect Email] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Helper function to retrieve Instagram credentials from Firestore, falling back to environment variables.
 */
async function getInstagramCredentials(): Promise<{ access_token: string; instagram_business_account_id: string; app_id: string; app_secret: string }> {
  const db = admin.firestore();
  const configDoc = await db.collection('config').doc('instagram').get();
  
  const app_id = process.env.FACEBOOK_APP_ID || '';
  const app_secret = process.env.FACEBOOK_APP_SECRET || '';

  if (configDoc.exists) {
    const data = configDoc.data();
    if (data && data.access_token && data.instagram_business_account_id) {
      return {
        access_token: data.access_token,
        instagram_business_account_id: data.instagram_business_account_id,
        app_id: data.app_id || app_id,
        app_secret: data.app_secret || app_secret
      };
    }
  }

  // Fallback to env
  const access_token = process.env.FACEBOOK_ACCESS_TOKEN;
  const instagram_business_account_id = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  
  if (!access_token || !instagram_business_account_id) {
    throw new Error('Instagram credentials not configured. Please set them up in Firestore or functions/.env');
  }

  // Self-healing: If we have app_id and app_secret, upgrade the token automatically on-the-fly and save to Firestore
  if (app_id && app_secret && access_token && !access_token.startsWith('IGAA')) {
    try {
      console.log('[Instagram Credentials] Attempting automatic token upgrade for fallback env token...');
      const upgradedToken = await upgradeAndStoreFacebookToken(access_token, app_id, app_secret, instagram_business_account_id);
      return {
        access_token: upgradedToken,
        instagram_business_account_id,
        app_id,
        app_secret
      };
    } catch (e: any) {
      console.error('[Instagram Credentials] Failed auto-upgrading fallback env token:', e);
    }
  }

  return { access_token, instagram_business_account_id, app_id, app_secret };
}

/**
 * Helper function to exchange a short-lived user/page token for a long-lived page token and store it in Firestore.
 */
async function upgradeAndStoreFacebookToken(shortLivedToken: string, appId: string, appSecret: string, instagramAccountId: string) {
  const db = admin.firestore();

  console.log('[Token Upgrade] Exchanging short-lived token for long-lived user token...');
  
  // 1. Exchange short-lived token for long-lived user token
  const exchangeRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );
  const exchangeData: any = await exchangeRes.json();
  if (!exchangeRes.ok || !exchangeData.access_token) {
    throw new Error(`Failed to exchange token: ${JSON.stringify(exchangeData)}`);
  }
  const longLivedUserToken = exchangeData.access_token;

  console.log('[Token Upgrade] Fetching accounts/pages for the user...');
  
  // 2. Fetch pages linked to this user token
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedUserToken}`
  );
  const accountsData: any = await accountsRes.json();
  if (!accountsRes.ok || !accountsData.data) {
    throw new Error(`Failed to fetch pages: ${JSON.stringify(accountsData)}`);
  }

  let pageAccessToken = '';
  let matchedPageId = '';

  // Find the page linked to the instagramAccountId
  for (const page of accountsData.data) {
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData: any = await igRes.json();
      if (igRes.ok && igData.instagram_business_account?.id === instagramAccountId) {
        pageAccessToken = page.access_token;
        matchedPageId = page.id;
        console.log(`[Token Upgrade] Found matching page ${page.name} (${page.id}) linked to Instagram Account ${instagramAccountId}.`);
        break;
      }
    } catch (e) {
      console.warn(`[Token Upgrade] Failed to query Instagram account for page ${page.id}:`, e);
    }
  }

  // Fallback: If no instagram business account matched, use the first page's access token
  if (!pageAccessToken && accountsData.data.length > 0) {
    pageAccessToken = accountsData.data[0].access_token;
    matchedPageId = accountsData.data[0].id;
    console.warn(`[Token Upgrade] No page matched Instagram Account ${instagramAccountId}. Defaulting to first page ${accountsData.data[0].name} (${matchedPageId}).`);
  }

  if (!pageAccessToken) {
    throw new Error('No Facebook pages found associated with this account token.');
  }

  // 3. Save to Firestore config/instagram
  const configRef = db.collection('config').doc('instagram');
  await configRef.set({
    access_token: pageAccessToken,
    instagram_business_account_id: instagramAccountId,
    app_id: appId,
    app_secret: appSecret,
    facebook_page_id: matchedPageId,
    last_refreshed: new Date().toISOString()
  });

  console.log(`[Token Upgrade] Successfully saved long-lived page token for page ${matchedPageId} to Firestore.`);
  return pageAccessToken;
}

/**
 * Helper to wait until an Instagram media container is finished processing by Meta.
 */
async function waitForMediaContainerReady(containerId: string, accessToken: string, maxAttempts = 15, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code,status&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();
      if (statusRes.ok && statusData) {
        const statusCode = statusData.status_code;
        if (statusCode === 'FINISHED') {
          return;
        }
        if (statusCode === 'ERROR') {
          throw new Error(`Media container ${containerId} processing failed with status ERROR: ${JSON.stringify(statusData)}`);
        }
        if (statusCode === 'EXPIRED') {
          throw new Error(`Media container ${containerId} has expired.`);
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('ERROR') || err.message.includes('EXPIRED'))) {
        throw err;
      }
      console.warn(`[Instagram] Container ${containerId} status check attempt ${attempt} failed:`, err);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`Media container ${containerId} was not ready after ${maxAttempts * (delayMs / 1000)} seconds.`);
}

/**
 * Helper to publish a post directly to Instagram using the uploaded image in Firebase Storage.
 */
async function publishPostToInstagramDirect(postId: string, hasGeneratedImage = true) {
  const db = admin.firestore();
  const docRef = db.collection('social_posts').doc(postId);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error('Social post not found');
  }
  const post = doc.data()!;

  const bucket = admin.storage().bucket('bervos-official.firebasestorage.app');
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/social_posts/${postId}.png`;

  const { access_token: facebookAccessToken, instagram_business_account_id: instagramAccountId } = await getInstagramCredentials();

  const caption = post.caption_english || '';
  let creationId: string;

  const screenshots = post.screenshots || [];
  const resolvedSlides = (post.slides !== undefined && Array.isArray(post.slides)
    ? post.slides.map((slide: string) => slide === '__generated__' && hasGeneratedImage ? imageUrl : slide)
    : [imageUrl, ...screenshots]
  ).filter((url: string) => url && url !== '__generated__');

  if (resolvedSlides.length === 0) {
    throw new Error('At least one image/slide is required to publish to Instagram.');
  }

  if (resolvedSlides.length > 1) {
    // Carousel post
    const itemContainerIds: string[] = [];

    for (const url of resolvedSlides) {
      const itemRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: facebookAccessToken
        })
      });

      const itemData = await itemRes.json();
      if (!itemRes.ok || !itemData.id) {
        throw new Error(`Failed to create carousel item container for ${url}: ${JSON.stringify(itemData)}`);
      }
      itemContainerIds.push(itemData.id);
    }

    // Wait for all item containers to be finished processing by Meta
    for (const itemContainerId of itemContainerIds) {
      await waitForMediaContainerReady(itemContainerId, facebookAccessToken);
    }

    // Create carousel container
    const carouselRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: itemContainerIds,
        caption,
        access_token: facebookAccessToken
      })
    });

    const carouselData = await carouselRes.json();
    if (!carouselRes.ok || !carouselData.id) {
      throw new Error(`Failed to create carousel container: ${JSON.stringify(carouselData)}`);
    }
    creationId = carouselData.id;
  } else {
    // Single image post
    const singleImageUrl = resolvedSlides[0];
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: singleImageUrl,
        caption,
        access_token: facebookAccessToken
      })
    });

    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      throw new Error(`Failed to create media container: ${JSON.stringify(containerData)}`);
    }
    creationId = containerData.id;
  }

  // Wait until the container is FINISHED processing by Meta before publishing
  await waitForMediaContainerReady(creationId, facebookAccessToken);

  // Publish Media Container
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: facebookAccessToken
    })
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || !publishData.id) {
    throw new Error(`Failed to publish media: ${JSON.stringify(publishData)}`);
  }

  // Fetch post permalink
  let permalink: string | null = null;
  try {
    const permalinkRes = await fetch(
      `https://graph.facebook.com/v19.0/${publishData.id}?fields=permalink&access_token=${facebookAccessToken}`
    );
    const permalinkData = await permalinkRes.json();
    if (permalinkRes.ok && permalinkData.permalink) {
      permalink = permalinkData.permalink;
    }
  } catch (e) {
    console.warn('[Instagram] Could not fetch permalink:', e);
  }

  // Update status in Firestore
  const todayStr = new Date().toISOString().split('T')[0];
  await docRef.update({
    status: 'Published',
    instagram_media_id: publishData.id,
    instagram_permalink: permalink,
    published_at: new Date().toISOString(),
    suggested_date: todayStr,
    scheduled_at: null
  });

  return { mediaId: publishData.id, permalink };
}

/**
 * POST /api/social/:id/instagram — Publish a social post to Instagram or schedule it internally
 */
app.post('/api/social/:id/instagram', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { imageData, scheduled_at } = req.body;

    const db = admin.firestore();
    const docRef = db.collection('social_posts').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Social post not found' });
    }

    const bucket = admin.storage().bucket('bervos-official.firebasestorage.app');
    let imageUrl: string | null = null;

    // 1. Upload base64 image to Firebase Storage (if provided)
    if (imageData) {
      const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const file = bucket.file(`social_posts/${id}.png`);
      await file.save(buffer, {
        metadata: { contentType: 'image/png' },
        public: true,
        resumable: false
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/social_posts/${id}.png`;
    }

    // 2. Check if we are scheduling internally
    if (scheduled_at) {
      const utcScheduledAt = new Date(scheduled_at).toISOString();
      const scheduledDateStr = scheduled_at.includes('T') && !scheduled_at.endsWith('Z')
        ? scheduled_at.split('T')[0]
        : utcScheduledAt.split('T')[0];

      await docRef.update({
        status: 'Scheduled',
        scheduled_at: utcScheduledAt,
        suggested_date: scheduledDateStr
      });

      return res.json({
        success: true,
        scheduled: true,
        scheduled_at: utcScheduledAt,
        scheduledDate: scheduledDateStr,
        imageUrl
      });
    }

    // 3. Immediate publish
    const result = await publishPostToInstagramDirect(id, !!imageData);

    return res.json({
      success: true,
      mediaId: result.mediaId,
      permalink: result.permalink,
      imageUrl
    });

  } catch (err: any) {
    console.error('[API] Error publishing to Instagram:', err);
    return res.status(500).json({
      error: 'Failed to publish to Instagram',
      details: err.message
    });
  }
});

/**
 * DELETE /api/social/:id/instagram/schedule — Cancel a scheduled Instagram post
 */
app.delete('/api/social/:id/instagram/schedule', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    const docRef = db.collection('social_posts').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Social post not found' });
    }
    const post = doc.data();

    if (post?.status !== 'Scheduled') {
      return res.status(400).json({ error: 'Post is not scheduled' });
    }

    // If scheduled via legacy Instagram API, delete container from Instagram
    if (post?.instagram_scheduled_id) {
      try {
        const { access_token: facebookAccessToken, instagram_business_account_id: instagramAccountId } = await getInstagramCredentials();
        if (instagramAccountId && facebookAccessToken) {
          const deleteRes = await fetch(`https://graph.facebook.com/v19.0/${post.instagram_scheduled_id}?access_token=${facebookAccessToken}`, {
            method: 'DELETE'
          });
          const deleteData = await deleteRes.json();
          if (!deleteRes.ok) {
            console.warn(`[API] Failed to delete scheduled container: ${JSON.stringify(deleteData)}`);
          }
        }
      } catch (e) {
        console.warn('[API] Error deleting legacy scheduled container:', e);
      }
    }

    // Update Firestore to clear schedule fields
    await docRef.update({
      status: 'Approved',
      instagram_scheduled_id: null,
      scheduled_at: null
    });

    return res.json({
      success: true,
      message: 'Scheduled post cancelled successfully'
    });

  } catch (err: any) {
    console.error('[API] Error cancelling scheduled Instagram post:', err);
    return res.status(500).json({
      error: 'Failed to cancel scheduled post',
      details: err.message
    });
  }
});

/**
 * POST /api/social/:id/regenerate — Regenerate caption using Gemini AI
 */
app.post('/api/social/:id/regenerate', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    const docRef = db.collection('social_posts').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Social post not found' });
    }
    const post = doc.data();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Missing Gemini API Key',
        details: 'Please add GEMINI_API_KEY to functions/.env to use AI caption regeneration.'
      });
    }

    const prompt = `
You are an expert copywriter writing an Instagram post for a technical project.
Here is the project and the current post details:
- Project: ${post?.project}
- Description/Hook: ${post?.hook}
- Current Caption: ${post?.caption_english}
- Notes / Revision History: ${post?.user_feedback || 'None'}

Please write a fresh, high-quality, engaging Instagram caption for this update.
Follow these strict instructions:
1. Start with a strong technical hook (1 line, attention-grabbing). Start the hook with a technical compromise, bottleneck, or a highly specific engineering observation (e.g., "Web Audio latency in Safari is a nightmare. Here is how we bypassed it...").
2. Follow the hook with a double line break, then a short, clear paragraph (2-3 sentences) describing the problem, bottleneck, or context. Focus on concrete engineering metrics, size improvements, or latency reductions where possible.
3. Use a bulleted list (using clear Unicode bullets like '•') to highlight 3-4 key technical features, implementation steps, or performance improvements. This keeps the text highly structured and easy to read. Each bullet point MUST be on a new line.
4. Conclude with an open-ended, technical question inviting developers in the comments to share their own experiences or setup preferences (e.g. "How are you handling local state sync in your React PWA?"), then add a short 1-sentence call-to-action with the project URL.
5. The tone must be that of an engineering lead sharing a raw, transparent tech update in a "Build in Public" format. Do NOT use generic marketing jargon (e.g., "revolutionise", "seamlessly", "game-changer", "unlock", "supercharge", "elevate").
6. Do NOT include slide headers like "[SLIDE 1]" or "[THE BOTTLENECK]".
7. Add 2-3 hashtags inline on key words in the text (e.g. #Firebase, #Ollama, #SwiftUI).
8. At the very end of the caption, add 3-5 relevant, specific, niche hashtags focusing on tools, platforms, or AI models (no general tags like #BuildInPublic or #SideProject).
9. Separately, write a 1-2 sentence concise Summary in English (no Spanish) of what this update is about.

CRITICAL JSON FORMATTING RULE: You must use literal '\\n' escape sequences in the JSON string value for 'caption_english' to represent all line breaks and vertical spacing. Each block (hook, introduction, each bullet point, conclusion, and hashtag block) MUST be separated by literal '\\n' or '\\n\\n' so it renders as multiple paragraphs/lines. Do not output it as a single line of text.

Return the result as a JSON object matching this structure:
{
  "caption_english": "The full English caption with inline hashtags, end hashtags, and literal \\n escape sequences for newlines",
  "summary_english": "The 1-2 sentence English summary"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              caption_english: { type: "STRING" },
              summary_english: { type: "STRING" }
            },
            required: ["caption_english", "summary_english"]
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API call failed: ${errText}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed = JSON.parse(textResult);
    const updates = {
      caption_english: parsed.caption_english,
      caption_spanish: parsed.summary_english, // store English summary in caption_spanish field
      updated_at: new Date().toISOString()
    };

    await docRef.update(updates);
    return res.json({
      success: true,
      caption_english: updates.caption_english,
      caption_spanish: updates.caption_spanish
    });

  } catch (err: any) {
    console.error('[API] Error regenerating caption:', err);
    return res.status(500).json({
      error: 'Failed to regenerate caption',
      details: err.message
    });
  }
});

/**
 * POST /api/social/custom-draft — Generate a custom social post draft using Gemini AI
 */
app.post('/api/social/custom-draft', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { project, prompt: userPrompt, postType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Missing Gemini API Key',
        details: 'Please add GEMINI_API_KEY to functions/.env to use AI custom draft generation.'
      });
    }

    let projectItem: any = null;
    let commitsText = 'None';

    if (project && project.toLowerCase() !== 'none') {
      const initiatives = await getInitiativesFromSchema();
      projectItem = initiatives.find(item =>
        item.name.toLowerCase() === project.toLowerCase()
      );
      
      if (projectItem) {
        const url = projectItem.url || projectItem.codeRepository;
        const commitUrl = projectItem.codeRepository || url;
        try {
          const commits = await getRepoCommits(project, commitUrl, 10);
          if (commits && commits.length > 0) {
            commitsText = commits.map(c => `[${c.date}] ${c.message} (by ${c.author})`).join('\n');
          }
        } catch (e) {
          console.warn(`[Custom Draft] Could not load commits for ${project}:`, e);
        }
      }
    }

    const geminiPrompt = `
You are an expert copywriter writing a post for an ecosystem/project updates feed.
The user wants to write about a specific topic related to a project.

Here are the details:
- Project Name: ${projectItem ? projectItem.name : 'General / Other'}
- Project Description: ${projectItem ? projectItem.description : 'N/A'}
- Project URL: ${projectItem ? (projectItem.url || projectItem.codeRepository) : 'N/A'}
- Post Type Requested: ${postType || 'vibe_coding_reality'}
- Topic/Prompt from User: "${userPrompt}"

${projectItem ? `Here are some recent git commit messages from the project repository for context:
${commitsText}
` : ''}

Please write a fresh, high-quality, engaging, and detailed post caption.
Follow these strict instructions:
1. Start with a strong technical hook (1 line, attention-grabbing, matching the selected Post Type). Start the hook with a technical compromise, bottleneck, or a highly specific engineering observation (e.g., "Web Audio latency in Safari is a nightmare. Here is how we bypassed it...").
2. Follow the hook with a double line break, then a short, clear paragraph (2-3 sentences) describing the problem, bottleneck, or context. Focus on concrete engineering metrics, size improvements, or latency reductions where possible.
3. Use a bulleted list (using clear Unicode bullets like '•') to highlight 3-4 key technical features, implementation steps, or performance improvements. This keeps the text highly structured and easy to read. Each bullet point MUST be on a new line. You should be smart and pull context from the recent commits and the user's prompt to make these bullets highly relevant, realistic, and technically detailed.
4. Conclude with an open-ended, technical question inviting developers in the comments to share their own experiences or setup preferences (e.g. "How are you handling local state sync in your React PWA?"), then add a short 1-sentence call-to-action with the project URL.
5. The tone must be that of an engineering lead sharing a raw, transparent tech update in a "Build in Public" format. Do NOT use generic marketing jargon (e.g., "revolutionise", "seamlessly", "game-changer", "unlock", "supercharge", "elevate").
6. Do NOT include slide headers like "[SLIDE 1]".
7. Add 2-3 hashtags inline on key words in the text (e.g. #Firebase, #Ollama, #SwiftUI).
8. At the very end of the caption, add 3-5 relevant, specific, niche hashtags focusing on tools, platforms, or AI models (no general tags like #BuildInPublic or #SideProject).
9. Also generate a short (1-2 sentences) Spanish summary/caption for translation/localization.
10. Generate a detailed "visual_instruction" describing what graphic or diagram should be generated to represent this post visually.
11. Generate a "mermaid_code" diagram representing the flow or architecture if it is relevant/insightful for the post (especially for under_the_hood posts). If not relevant, set to null.

CRITICAL JSON FORMATTING RULE: You must use literal '\\n' escape sequences in the JSON string values to represent all line breaks and vertical spacing. Do not output actual newlines in JSON values.

Return the result as a JSON object matching this structure:
{
  "hook": "Strong technical hook (1 line)",
  "caption_english": "The full English caption with inline hashtags, end hashtags, and literal \\n escape sequences",
  "caption_spanish": "The 1-2 sentence Spanish summary/caption",
  "visual_instruction": "Description of the visual graphic/diagram",
  "mermaid_code": "Mermaid diagram code, or null if not applicable"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              hook: { type: "STRING" },
              caption_english: { type: "STRING" },
              caption_spanish: { type: "STRING" },
              visual_instruction: { type: "STRING" },
              mermaid_code: { type: "STRING", nullable: true }
            },
            required: ["hook", "caption_english", "caption_spanish", "visual_instruction"]
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API call failed: ${errText}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsed = JSON.parse(textResult);
    return res.json({
      success: true,
      draft: {
        project: projectItem ? projectItem.name : 'General',
        post_type: postType || 'vibe_coding_reality',
        hook: parsed.hook,
        caption_english: parsed.caption_english,
        caption_spanish: parsed.caption_spanish,
        visual_instruction: parsed.visual_instruction,
        mermaid_code: parsed.mermaid_code || null
      }
    });

  } catch (err: any) {
    console.error('[API] Error generating custom draft:', err);
    return res.status(500).json({
      error: 'Failed to generate custom draft',
      details: err.message
    });
  }
});

/**
 * POST /api/social — Create a new social post manually or from draft
 */
app.post('/api/social', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { project, post_type, hook, caption_english, caption_spanish, visual_instruction, mermaid_code, suggested_date, scheduled_at } = req.body;
    const db = admin.firestore();
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomId = Math.random().toString(36).substring(2, 6);
    const id = `${dateStr}-custom-${(project || 'general').toLowerCase().replace(/[^a-z0-9]/g, '')}-${randomId}`;

    const now = new Date().toISOString();
    const postData = {
      id,
      status: 'Draft',
      project: project || 'General',
      post_type: post_type || 'vibe_coding_reality',
      hook: hook || '',
      caption_english: caption_english || '',
      caption_spanish: caption_spanish || '',
      visual_instruction: visual_instruction || '',
      mermaid_code: mermaid_code || null,
      suggested_date: suggested_date || '',
      scheduled_at: scheduled_at || null,
      user_feedback: '',
      created_at: now,
      updated_at: now,
      slides: [],
      screenshots: []
    };

    await db.collection('social_posts').doc(id).set(postData);
    return res.json({ success: true, post: postData });
  } catch (err: any) {
    console.error('[API] Error creating social post:', err);
    return res.status(500).json({ error: 'Failed to create social post', details: err.message });
  }
});

/**
 * POST /api/social/scheduler/check — Trigger a manual run of the scheduled posts checker
 */
app.post('/api/social/scheduler/check', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const result = await checkAndPublishDuePosts();
    return res.json({
      success: true,
      processed: result.processedCount,
      errors: result.errors
    });
  } catch (err: any) {
    console.error('[API] Error triggering manual scheduled check:', err);
    return res.status(500).json({
      error: 'Failed to run scheduled posts check',
      details: err.message
    });
  }
});

/**
 * GET /api/social/instagram/token — Get token metadata (e.g. last_refreshed date)
 */
app.get('/api/social/instagram/token', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const db = admin.firestore();
    const configDoc = await db.collection('config').doc('instagram').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      return res.json({
        success: true,
        last_refreshed: data?.last_refreshed || null
      });
    }
    return res.json({ success: true, last_refreshed: null });
  } catch (err: any) {
    console.error('[API] Error getting Instagram token metadata:', err);
    return res.status(500).json({ error: 'Failed to get token metadata' });
  }
});

/**
 * POST /api/social/instagram/token — Exchange and store a long-lived Instagram publishing token
 */
app.post('/api/social/instagram/token', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { short_lived_token, app_id, app_secret, instagram_business_account_id } = req.body;
    
    // Fallback to env config if not supplied in body
    const finalAppId = app_id || process.env.FACEBOOK_APP_ID;
    const finalAppSecret = app_secret || process.env.FACEBOOK_APP_SECRET;
    const finalInstagramId = instagram_business_account_id || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!short_lived_token) {
      return res.status(400).json({ error: 'short_lived_token is required' });
    }
    if (!finalAppId || !finalAppSecret || !finalInstagramId) {
      return res.status(400).json({ error: 'App ID, App Secret, and Instagram Account ID must be supplied or configured in .env' });
    }

    const longLivedToken = await upgradeAndStoreFacebookToken(
      short_lived_token,
      finalAppId,
      finalAppSecret,
      finalInstagramId
    );

    return res.json({
      success: true,
      message: 'Token successfully upgraded to long-lived Page Access Token and stored in Firestore.',
      token_preview: `${longLivedToken.substring(0, 8)}...`
    });
  } catch (err: any) {
    console.error('[API] Error upgrading Instagram token:', err);
    return res.status(500).json({
      error: 'Failed to upgrade Instagram token',
      details: err.message
    });
  }
});

/**
 * DELETE /api/social/:id — Delete a social post (saves tombstone in discarded_posts so pipeline never restores it)
 */
app.delete('/api/social/:id', authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const db = admin.firestore();
    
    // Save tombstone in discarded_posts so pipeline ignores and never regenerates it
    const docRef = db.collection('social_posts').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      await db.collection('discarded_posts').doc(id).set({
        id,
        project: data?.project || '',
        hook: data?.hook || '',
        discarded_at: new Date().toISOString()
      });
    } else {
      await db.collection('discarded_posts').doc(id).set({
        id,
        discarded_at: new Date().toISOString()
      });
    }

    await docRef.delete();
    res.json({ success: true, id });
  } catch (err) {
    console.error('[API] Error deleting social post:', err);
    res.status(500).json({ error: 'Failed to delete social post' });
  }
});

async function fetchTelemetryLogsForProject(app: admin.app.App, projectId: string, projectName: string): Promise<any[]> {
  const db = admin.firestore(app);
  const logs: any[] = [];
  const collectionsToTry = ['telemetry', 'downloads', 'metrics'];

  for (const colName of collectionsToTry) {
    try {
      // Try ordering by timestamp descending
      let snapshot = await db.collection(colName).orderBy('timestamp', 'desc').limit(50).get();
      if (snapshot.empty) {
        // Try ordering by createdAt descending
        snapshot = await db.collection(colName).orderBy('createdAt', 'desc').limit(50).get();
      }
      if (snapshot.empty) {
        // Try query without ordering
        snapshot = await db.collection(colName).limit(50).get();
      }

      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const tsVal = data.timestamp || data.createdAt || data.date || data.time;
          let timestamp = '';
          if (tsVal) {
            if (typeof tsVal.toDate === 'function') {
              timestamp = tsVal.toDate().toISOString();
            } else {
              const parsedDate = new Date(tsVal);
              if (!isNaN(parsedDate.getTime())) {
                timestamp = parsedDate.toISOString();
              }
            }
          }
          if (!timestamp) continue;

          logs.push({
            id: `download-${projectId}-${doc.id}`,
            type: 'DOWNLOAD',
            project: projectName,
            tool: data.tool || data.fileName || data.file || data.name || projectName,
            version: data.version || data.appVersion || '1.0.0',
            os: data.os || data.platform || data.system || 'Unknown OS',
            timestamp
          });
        }
        break;
      }
    } catch (err) {
      // Ignore and continue to next collection
    }
  }

  return logs;
}

async function fetchTelemetryLogsViaCli(projectId: string, projectName: string): Promise<any[]> {
  const token = await getValidAccessToken();
  if (!token) return [];

  const logs: any[] = [];
  const collectionsToTry = ['telemetry', 'downloads', 'metrics'];

  const runLogsQuery = async (collectionName: string): Promise<any[]> => {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          limit: 50,
          orderBy: [
            {
              field: { fieldPath: 'timestamp' },
              direction: 'DESCENDING'
            }
          ]
        }
      });

      const req = https.request({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 4000
      }, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => body += chunk);
        res.on('end', () => {
          try {
            const arr = JSON.parse(body);
            if (!Array.isArray(arr)) {
              resolve([]);
              return;
            }
            const parsedLogs: any[] = [];
            for (const item of arr) {
              if (item && item.document) {
                const doc = item.document;
                const fields = doc.fields || {};
                const nameParts = doc.name.split('/');
                const docId = nameParts[nameParts.length - 1];

                const getVal = (f: any) => {
                  if (!f) return undefined;
                  if (f.stringValue !== undefined) return f.stringValue;
                  if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
                  if (f.doubleValue !== undefined) return parseFloat(f.doubleValue);
                  if (f.timestampValue !== undefined) return f.timestampValue;
                  return undefined;
                };

                const tsVal = getVal(fields.timestamp) || getVal(fields.createdAt) || getVal(fields.date) || getVal(fields.time);
                let timestamp = '';
                if (tsVal) {
                  const parsedDate = new Date(tsVal);
                  if (!isNaN(parsedDate.getTime())) {
                    timestamp = parsedDate.toISOString();
                  }
                }
                if (!timestamp) continue;

                parsedLogs.push({
                  id: `download-${projectId}-${docId}`,
                  type: 'DOWNLOAD',
                  project: projectName,
                  tool: getVal(fields.tool) || getVal(fields.fileName) || getVal(fields.file) || getVal(fields.name) || projectName,
                  version: getVal(fields.version) || getVal(fields.appVersion) || '1.0.0',
                  os: getVal(fields.os) || getVal(fields.platform) || getVal(fields.system) || 'Unknown OS',
                  timestamp
                });
              }
            }
            resolve(parsedLogs);
          } catch (e) {
            resolve([]);
          }
        });
      });

      req.on('error', () => resolve([]));
      req.write(postData);
      req.end();
    });
  };

  for (const colName of collectionsToTry) {
    const colLogs = await runLogsQuery(colName);
    if (colLogs.length > 0) {
      logs.push(...colLogs);
      break;
    }
  }

  return logs;
}

app.get(['/logs', '/api/logs'], authenticateAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const initiatives = await getInitiativesFromSchema();
    const userJoinLogs: any[] = [];
    const downloadLogs: any[] = [];

    // 1. Gather User Join Logs
    const aggregatedUsers = await fetchAllUsersAggregated();
    for (const user of aggregatedUsers) {
      for (const [projectName, details] of Object.entries(user.projectDetails || {})) {
        const firstActive = (details as any).firstActive;
        if (firstActive) {
          userJoinLogs.push({
            id: `user-join-${user.email}-${projectName}-${firstActive}`,
            type: 'USER_JOIN',
            project: projectName,
            userEmail: user.email,
            userDisplayName: user.displayName || user.email.split('@')[0],
            userPhotoURL: user.photoURL || '',
            timestamp: firstActive
          });
        }
      }
    }

    // 2. Gather Download Logs for Utility apps
    for (const item of initiatives) {
      const type = item['@type'];
      const name = item.name;
      const isUtility = item.applicationCategory === 'UtilitiesApplication';
      if (type === 'SoftwareApplication' && isUtility) {
        const projectId = getProjectId(item);
        const projectApp = getProjectApp(projectId);

        let logs: any[] = [];
        if (projectApp) {
          logs = await fetchTelemetryLogsForProject(projectApp, projectId, name);
        } else {
          logs = await fetchTelemetryLogsViaCli(projectId, name);
        }
        downloadLogs.push(...logs);
      }
    }

    // 3. Gather Social Scheduler Logs
    const socialLogs: any[] = [];
    try {
      const db = admin.firestore();
      const socialSnap = await db.collection('social_posts').get();
      for (const doc of socialSnap.docs) {
        const data = doc.data();
        const project = data.project || 'Social';

        // Success Publish Event
        if (data.status === 'Published' && data.published_at) {
          socialLogs.push({
            id: `social-publish-${doc.id}`,
            type: 'SOCIAL_PUBLISH',
            project: project,
            title: data.hook || 'Instagram post published',
            caption: data.caption_english || '',
            timestamp: data.published_at
          });
        }

        // Failure/Error Event
        if (data.user_feedback && data.user_feedback.includes('Scheduler Publish Error')) {
          const match = data.user_feedback.match(/\[Scheduler Publish Error at ([^\]]+)\]:\s*([\s\S]*)/);
          let timestamp = data.updated_at || new Date().toISOString();
          let errorMessage = data.user_feedback;
          if (match && match[1]) {
            timestamp = match[1];
            errorMessage = match[2];
          }

          socialLogs.push({
            id: `social-error-${doc.id}-${timestamp}`,
            type: 'SOCIAL_ERROR',
            project: project,
            errorMessage: errorMessage,
            timestamp
          });
        }
      }
    } catch (err) {
      console.warn('[Logs API] Failed to fetch social posts for logs:', err);
    }

    // 4. Fallback mock download logs for local testing/emulator
    if (process.env.FUNCTIONS_EMULATOR === 'true' && downloadLogs.length === 0) {
      const tools = ['Aura', 'Pinmage', 'YT2MP3'];
      const platforms = ['macOS', 'Windows', 'iOS', 'Linux'];
      const versions = ['1.3.0', '1.1.0', '2.1.1', '1.0.4'];
      const now = Date.now();
      for (let i = 0; i < 25; i++) {
        const project = tools[i % tools.length];
        const timestamp = new Date(now - i * 4 * 3600 * 1000).toISOString();
        downloadLogs.push({
          id: `mock-download-${project}-${i}`,
          type: 'DOWNLOAD',
          project: project,
          tool: project,
          version: versions[i % versions.length],
          os: platforms[i % platforms.length],
          timestamp
        });
      }
    }

    // 5. Fallback mock social logs for emulator testing
    if (process.env.FUNCTIONS_EMULATOR === 'true' && socialLogs.length === 0) {
      const projects = ['Chessverse', 'Tonaly', 'LaresDJ', 'Billio'];
      const now = Date.now();
      for (let i = 0; i < 8; i++) {
        const project = projects[i % projects.length];
        const timestamp = new Date(now - i * 8 * 3600 * 1000).toISOString();
        if (i % 3 === 2) {
          socialLogs.push({
            id: `mock-social-error-${project}-${i}`,
            type: 'SOCIAL_ERROR',
            project: project,
            errorMessage: 'Instagram Graph API error: The Page Access Token has expired or is invalid. Please refresh the token.',
            timestamp
          });
        } else {
          socialLogs.push({
            id: `mock-social-publish-${project}-${i}`,
            type: 'SOCIAL_PUBLISH',
            project: project,
            title: `New visual showcase post for ${project}`,
            caption: `Check out our latest update for ${project}! We have added offline support and custom dashboards.`,
            timestamp
          });
        }
      }
    }

    // 6. Combine and sort all logs
    const allLogs = [...userJoinLogs, ...downloadLogs, ...socialLogs].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );

    res.json(allLogs);
  } catch (err) {
    console.error('[API] Unexpected error in /logs endpoint:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) });
  }
});

// Export Cloud Function
export const hubApi = functions.https.onRequest(app);

/**
 * Helper function to check and publish any due scheduled posts.
 */
async function checkAndPublishDuePosts(): Promise<{ processedCount: number; errors: string[] }> {
  const db = admin.firestore();
  const now = new Date().toISOString();
  let processedCount = 0;
  const errors: string[] = [];

  console.log(`[Scheduler] Checking for due scheduled posts at ${now}...`);

  const snapshot = await db.collection('social_posts')
    .where('status', '==', 'Scheduled')
    .get();

  if (snapshot.empty) {
    console.log('[Scheduler] No scheduled posts in the queue.');
    return { processedCount, errors };
  }

  const duePosts = snapshot.docs.filter(doc => {
    const data = doc.data();
    return data.scheduled_at && data.scheduled_at <= now;
  });

  if (duePosts.length === 0) {
    console.log('[Scheduler] No scheduled posts due at this time.');
    return { processedCount, errors };
  }

  console.log(`[Scheduler] Found ${duePosts.length} posts due for publication.`);

  for (const doc of duePosts) {
    const postId = doc.id;
    try {
      console.log(`[Scheduler] Processing post ${postId}...`);
      await publishPostToInstagramDirect(postId);
      console.log(`[Scheduler] Successfully published post ${postId}`);
      processedCount++;
    } catch (err: any) {
      console.error(`[Scheduler] Failed to publish post ${postId}:`, err);
      errors.push(`Post ${postId}: ${err.message || err}`);
      // Revert post back to Approved and log error in user_feedback
      await doc.ref.update({
        status: 'Approved',
        user_feedback: `[Scheduler Publish Error at ${now}]: ${err.message || err}`,
        updated_at: new Date().toISOString()
      });
    }
  }

  return { processedCount, errors };
}

/**
 * Cron trigger running every 1 hour to find scheduled posts that are due and publish them.
 */
export const triggerScheduledPosts = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      await checkAndPublishDuePosts();
    } catch (err) {
      console.error('[Scheduler] Error running triggerScheduledPosts:', err);
    }
    return null;
  });

/**
 * Cron trigger running on the 1st of every month to refresh the Facebook/Instagram access token.
 */
export const refreshInstagramToken = functions.pubsub
  .schedule('0 0 1 * *')
  .onRun(async (context) => {
    console.log('[Token Refresh] Running scheduled monthly token refresh...');
    try {
      const creds = await getInstagramCredentials();
      if (!creds.app_id || !creds.app_secret) {
        console.warn('[Token Refresh] App ID or App Secret not configured. Cannot refresh token.');
        return null;
      }
      await upgradeAndStoreFacebookToken(
        creds.access_token,
        creds.app_id,
        creds.app_secret,
        creds.instagram_business_account_id
      );
      console.log('[Token Refresh] Token successfully refreshed.');
    } catch (err) {
      console.error('[Token Refresh] Error running token refresh:', err);
    }
    return null;
  });

/**
 * Cron trigger running twice per month (1st and 15th at 00:00 UTC) to generate social pipeline content automatically.
 */
export const onScheduleSocialPipeline = functions.pubsub
  .schedule('0 0 1,15 * *')
  .timeZone('UTC')
  .onRun(async (_context) => {
    console.log('[Scheduler] Running bi-weekly social content generation pipeline...');
    try {
      const result = await runSocialPipelineCore();
      console.log(`[Scheduler] Pipeline completed successfully. Generated ${result.generated} posts.`);
    } catch (err) {
      console.error('[Scheduler] Error running bi-weekly social pipeline:', err);
    }
    return null;
  });

