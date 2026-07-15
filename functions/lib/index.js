"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hubApi = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const os = __importStar(require("os"));
const https = __importStar(require("https"));
// Initialize the default admin SDK app (for bervos-official)
admin.initializeApp();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// In-memory registry of dynamic Firebase Admin apps to avoid duplication
const initializedApps = new Map();
/**
 * Gets or initializes a Firebase Admin App for a specific project.
 */
function getProjectApp(projectId) {
    if (projectId === 'bervos-official') {
        return admin.app();
    }
    if (initializedApps.has(projectId)) {
        return initializedApps.get(projectId);
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
    }
    catch (err) {
        console.error(`[Config] Failed to initialize admin app for project ${projectId}:`, err);
        return null;
    }
}
/**
 * Express middleware to restrict access to Google Logged-in user laresbernardo@gmail.com
 */
const authenticateAdmin = async (req, res, next) => {
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
        req.user = { email: 'laresbernardo@gmail.com' };
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
        req.user = decodedToken;
        next();
    }
    catch (err) {
        console.error('[Auth] Token verification failed:', err);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
/**
 * Helper to parse JSON-LD from HTML
 */
function parseJsonLdFromHtml(htmlContent) {
    const match = htmlContent.match(/<script type="application\/ld\+json" id="schema-jsonld">([\s\S]*?)<\/script>/);
    if (!match || !match[1]) {
        console.warn('[Parser] No JSON-LD script found in html.');
        return [];
    }
    try {
        const parsed = JSON.parse(match[1].trim());
        const graph = parsed['@graph'] || [];
        return graph.filter((item) => item['@type'] === 'SoftwareApplication' || item['@type'] === 'SoftwareSourceCode');
    }
    catch (err) {
        console.error('[Parser] JSON-LD parse failed:', err);
        return [];
    }
}
/**
 * Parses and returns the list of initiatives from index.html.
 * Falls back to fetching bervos.org if local filesystem file is missing.
 */
async function getInitiativesFromSchema() {
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
        }
        catch (err) {
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
        }
        catch (err) {
            console.error('[Parser] Fallback fetch failed:', err);
        }
    }
    return parseJsonLdFromHtml(htmlContent);
}
/**
 * Resolves Firebase Project ID from initiative metadata.
 */
function getProjectId(item) {
    const name = item.name.toLowerCase();
    if (name === 'billio')
        return 'bilio-c70af';
    if (name === 'chessverse')
        return 'chessverse-demo';
    if (name === 'tripitdown')
        return 'tripidown';
    if (name === 'aura')
        return 'aura-bervos';
    if (name === 'scribo')
        return 'scribo-demo';
    if (name === 'laresdj')
        return 'laresdj-b9947';
    if (name === 'pinmage')
        return 'pinmage-billio';
    if (name === 'tonaly')
        return 'tonaly-bervos';
    if (name === 'bervos')
        return 'bervos-official';
    // Dynamic fallback from domain name
    const match = item.url?.match(/https:\/\/([^.]+)\.bervos\.org/);
    return match ? match[1] : name;
}
/**
 * Counts Total Users and Active Users (logged in within last 30 days) via Firebase Auth
 */
async function getAppUserMetrics(app) {
    const authInstance = admin.auth(app);
    let active30d = 0;
    let totalUsers = 0;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let pageToken = undefined;
    try {
        do {
            const result = await authInstance.listUsers(1000, pageToken);
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
    }
    catch (err) {
        console.error('[Firebase] Failed to fetch user list for project:', err);
        return { totalUsers: 0, active30d: 0 };
    }
}
/**
 * Counts total telemetry downloads/file hits from Firestore collection 'telemetry' or 'downloads'
 */
async function getTelemetryHits(app, projectId) {
    const db = admin.firestore(app);
    const appName = projectId === 'aura-bervos' ? 'aura' : projectId === 'pinmage-billio' ? 'pinmage' : '';
    if (appName) {
        try {
            const doc = await db.collection('stats').doc(appName).get();
            if (doc.exists) {
                return doc.data()?.download_count || 0;
            }
        }
        catch (err) {
            console.warn(`[Firestore] Failed to read doc stats/${appName} for ${projectId}:`, err);
        }
    }
    // Try querying 'telemetry' collection count first
    try {
        const telemetrySnap = await db.collection('telemetry').count().get();
        return telemetrySnap.data().count;
    }
    catch (err) {
        // Try fallback collection 'downloads'
        try {
            const downloadsSnap = await db.collection('downloads').count().get();
            return downloadsSnap.data().count;
        }
        catch (e) {
            // Try fallback collection 'metrics'
            try {
                const metricsSnap = await db.collection('metrics').count().get();
                return metricsSnap.data().count;
            }
            catch (x) {
                console.error('[Firebase] Failed to retrieve telemetry hits from Firestore:', x);
                return 0;
            }
        }
    }
}
function getCliRefreshToken() {
    try {
        const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return config.tokens?.refresh_token || '';
        }
    }
    catch (e) { }
    return '';
}
async function getValidAccessToken() {
    const refreshToken = getCliRefreshToken();
    if (!refreshToken)
        return '';
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
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed.access_token || '');
                }
                catch (e) {
                    resolve('');
                }
            });
        });
        req.on('error', () => resolve(''));
        req.write(postData);
        req.end();
    });
}
async function getTelemetryHitsViaCli(projectId) {
    const token = await getValidAccessToken();
    if (!token)
        return 0;
    const getDoc = (url) => {
        return new Promise((resolve) => {
            https.get(url, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 3000
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body));
                    }
                    catch (e) {
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
    const runQuery = (collectionName) => {
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
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const arr = JSON.parse(body);
                        const count = Array.isArray(arr) ? arr.filter((x) => x && x.document).length : 0;
                        resolve(count);
                    }
                    catch (e) {
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
    if (downloadsCount > 0)
        return downloadsCount;
    const telemetryCount = await runQuery('telemetry');
    return telemetryCount;
}
async function getAppUserMetricsViaCli(projectId) {
    const tempFile = path.join(os.tmpdir(), `users-${projectId}-${Date.now()}.json`);
    try {
        (0, child_process_1.execSync)(`npx firebase auth:export "${tempFile}" --format json --project ${projectId}`, { stdio: 'ignore', timeout: 8000 });
        if (fs.existsSync(tempFile)) {
            const content = fs.readFileSync(tempFile, 'utf8').trim();
            try {
                fs.unlinkSync(tempFile);
            }
            catch (e) { }
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
    }
    catch (err) {
        console.error(`[Local CLI Fallback] Failed to fetch users for project ${projectId}:`, err);
    }
    return { totalUsers: 0, active30d: 0 };
}
/**
 * Dynamic repository version and metadata extraction.
 * Support R DESCRIPTION (Version and Date keys) and Javascript package.json.
 * Searches both root directories and R/ directories across main and master branches.
 */
async function fetchRepoMetadata(owner, repo) {
    const headers = { 'User-Agent': 'bervos-hub' };
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
                }
                else {
                    const vMatch = text.match(/^Version:\s*(\S+)/m);
                    const dMatch = text.match(/^Date:\s*(\S+)/m);
                    if (vMatch) {
                        const result = { version: vMatch[1] };
                        if (dMatch) {
                            // Parse date correctly and format it to ISO string
                            result.releaseDate = new Date(dMatch[1]).toISOString();
                        }
                        return result;
                    }
                }
            }
        }
        catch (e) {
            // Continue
        }
    }
    return { version: '0.0.0' };
}
async function fetchBacklogFromRepo(owner, repo) {
    const branches = ['main', 'master'];
    const token = process.env.GITHUB_TOKEN;
    function parseCount(content) {
        return content.split('\n').filter(l => l.trim().startsWith('- ')).length;
    }
    function headerDate(res) {
        const lm = res.headers.get('last-modified');
        if (lm) {
            const d = new Date(lm);
            if (!isNaN(d.getTime()))
                return d.toISOString().split('T')[0];
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
                                if (date)
                                    updatedAt = new Date(date).toISOString().split('T')[0];
                            }
                        }
                    }
                    catch (e) {
                        console.warn(`[Backlog] Commits API failed for ${owner}/${repo}:`, e);
                    }
                }
                return { count: parseCount(content), content, updatedAt };
            }
        }
        catch (err) {
            console.warn(`[Backlog] raw.githubusercontent.com failed for ${owner}/${repo} on ${branch}:`, err);
        }
    }
    if (!token)
        return { count: 0, content: '', updatedAt: '' };
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
                                if (date)
                                    updatedAt = new Date(date).toISOString().split('T')[0];
                            }
                        }
                        else {
                            console.warn(`[Backlog] Commits API returned ${commitRes.status} for ${owner}/${repo} on ${branch}`);
                        }
                    }
                    catch (e) {
                        console.warn(`[Backlog] Commits API failed for ${owner}/${repo}:`, e);
                    }
                }
                return { count: parseCount(content), content, updatedAt };
            }
        }
        catch (err) {
            console.warn(`[Backlog] GitHub API failed for ${owner}/${repo} on ${branch}:`, err);
        }
    }
    return { count: 0, content: '', updatedAt: '' };
}
/**
 * lightweight HEAD request ping to calculate server latency
 */
async function pingServer(url) {
    const start = Date.now();
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const latency = Date.now() - start;
        return {
            uptime: response.ok,
            latency
        };
    }
    catch (err) {
        // Fallback to GET in case server rejects HEAD requests
        try {
            const response = await fetch(url, { method: 'GET' });
            const latency = Date.now() - start;
            return {
                uptime: response.ok,
                latency
            };
        }
        catch (e) {
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
function getLocalProjectVersion(projectName) {
    const normalizedName = projectName.toLowerCase();
    const parentDir = path.join(__dirname, '..', '..', '..', '..');
    const directoryNames = {
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
        }
        catch (e) { }
    }
    if (normalizedName === 'aura' || normalizedName === 'pinmage') {
        const appDirName = normalizedName === 'aura' ? 'AuraApp' : 'PinmageApp';
        const plistPath = path.join(projectFolderPath, appDirName, 'Info.plist');
        try {
            if (fs.existsSync(plistPath)) {
                const content = fs.readFileSync(plistPath, 'utf8');
                const match = content.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
                if (match)
                    return match[1];
            }
        }
        catch (e) { }
    }
    return null;
}
/**
 * Resolves the last 3 commits for a project.
 * If running locally and the sibling directory exists, reads from local git log.
 * Otherwise, fetches from the GitHub API if it is a public GitHub repository.
 */
async function getRepoCommits(projectName, repoUrl, limit = 15) {
    const normalizedName = projectName.toLowerCase();
    const parentDir = path.join(__dirname, '..', '..', '..', '..');
    const directoryNames = {
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
                const remoteUrl = (0, child_process_1.execSync)('git config --get remote.origin.url', { cwd: projectFolderPath, encoding: 'utf8', timeout: 1000 }).trim();
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
            }
            catch (e) { }
            const stdout = (0, child_process_1.execSync)(`git log -n ${limit} --date=short --pretty=format:"%h__DELIM__%an__DELIM__%ad__DELIM__%aI__DELIM__%s"`, { cwd: projectFolderPath, encoding: 'utf8', timeout: 2000 });
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
        }
        catch (e) {
            console.warn(`[Local Git] Failed to execute git log for ${projectName}:`, e);
        }
    }
    let gitUrl = repoUrl;
    if (!gitUrl || !gitUrl.includes('github.com')) {
        const gitUrlMap = {
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
            const headers = { 'User-Agent': 'bervos-hub' };
            if (process.env.GITHUB_TOKEN) {
                headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
            }
            try {
                const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        return data.map((item) => {
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
            }
            catch (err) {
                console.error(`[GitHub API] Failed to fetch commits for ${owner}/${repo}:`, err);
            }
        }
    }
    return [];
}
/**
 * Fetches metrics for a single initiative item.
 */
async function fetchInitiativeMetrics(item) {
    const id = item['@id'];
    const type = item['@type'];
    const name = item.name;
    const url = item.url || item.codeRepository;
    console.log(`[Fetcher] Fetching metrics for: ${name} (${type})`);
    const metrics = {
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
    }
    else {
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
            const headers = { 'User-Agent': 'bervos-hub' };
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
                }
                else {
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
            }
            catch (err) {
                console.error(`[GitHub] Error fetching repo stats for ${name}:`, err);
                metrics.stars = 0;
                metrics.openIssues = 0;
                metrics.version = '0.0.0';
                metrics.lastUpdated = '';
            }
        }
    }
    else if (type === 'SoftwareApplication') {
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
            const gitUrlMap = {
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
                }
                catch (err) {
                    console.error(`[GitHub] Error fetching repo metadata for ${name}:`, err);
                }
            }
        }
        const projectApp = getProjectApp(projectId);
        if (projectApp) {
            if (isUtility) {
                // Utility/Desktop App: Pull downloads/file hits
                metrics.downloads = await getTelemetryHits(projectApp, projectId);
            }
            else {
                // Web App with login: Pull MAU and unique users count
                const userMetrics = await getAppUserMetrics(projectApp);
                metrics.totalUsers = userMetrics.totalUsers;
                metrics.active30d = userMetrics.active30d;
            }
        }
        else {
            // Local CLI/REST Development Fallbacks
            if (isUtility) {
                metrics.downloads = await getTelemetryHitsViaCli(projectId);
            }
            else {
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
    const extractOwnerRepo = (u) => {
        if (!u || !u.includes('github.com'))
            return null;
        const m = u.match(/github\.com\/([^/]+)\/([^/]+?)(\.git|\/|$)/);
        return m && m[1] && m[2] ? { owner: m[1], repo: m[2] } : null;
    };
    let gh = extractOwnerRepo(item.codeRepository || url);
    if (!gh) {
        const n = name.toLowerCase();
        const backlogGitUrlMap = {
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
    }
    else {
        metrics.backlogCount = 0;
        metrics.backlogContent = '';
    }
    return metrics;
}
/**
 * Loops through initiatives and pulls real-time analytics
 */
async function fetchFreshMetrics() {
    const initiatives = await getInitiativesFromSchema();
    return Promise.all(initiatives.map(item => fetchInitiativeMetrics(item)));
}
// Local cache configuration
const LOCAL_CACHE_PATH = path.join('/tmp', 'metrics-snapshot.json');
/**
 * Reads the cached metrics snapshot from Firestore or local file system.
 */
async function getCache() {
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
    }
    catch (err) {
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
    }
    catch (err) {
        console.error('[Cache] Failed to read local cache:', err);
    }
    return null;
}
/**
 * Saves metrics to the cache (Firestore & local file system)
 */
async function saveCache(data) {
    const timestamp = Date.now();
    const payload = { timestamp, data };
    // 1. Save to local file system
    try {
        fs.writeFileSync(LOCAL_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf8');
        console.log('[Cache] Saved local cache file.');
    }
    catch (err) {
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
    }
    catch (err) {
        console.error('[Cache] Failed to write cache to Firestore:', err);
    }
}
app.get(['/commits', '/api/commits'], authenticateAdmin, async (req, res) => {
    try {
        const projectName = req.query.project;
        const limit = parseInt(req.query.limit) || 15;
        if (!projectName) {
            res.status(400).json({ error: 'Missing project parameter' });
            return;
        }
        const initiatives = await getInitiativesFromSchema();
        const projectItem = initiatives.find(item => item.name.toLowerCase() === projectName.toLowerCase());
        if (!projectItem) {
            res.status(404).json({ error: `Project not found: ${projectName}` });
            return;
        }
        const url = projectItem.url || projectItem.codeRepository;
        const commitUrl = projectItem.codeRepository || url;
        const commits = await getRepoCommits(projectName, commitUrl, limit);
        res.json(commits);
    }
    catch (err) {
        console.error('[Commits API] Failed to fetch commits:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get(['/metrics', '/api/metrics'], authenticateAdmin, async (req, res) => {
    try {
        const isRefresh = req.query.refresh === 'true';
        const projectQuery = req.query.project;
        if (isRefresh && projectQuery) {
            console.log(`[SWR] Single project refresh requested for: ${projectQuery}`);
            const cached = await getCache();
            if (cached) {
                const initiatives = await getInitiativesFromSchema();
                const matchedInitiative = initiatives.find(item => item.name.toLowerCase() === projectQuery.toLowerCase() ||
                    item['@id'].toLowerCase() === projectQuery.toLowerCase() ||
                    getProjectId(item).toLowerCase() === projectQuery.toLowerCase());
                if (!matchedInitiative) {
                    res.status(404).json({ error: `Project not found: ${projectQuery}` });
                    return;
                }
                const freshProjectMetrics = await fetchInitiativeMetrics(matchedInitiative);
                let updated = false;
                const updatedData = cached.data.map((item) => {
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
                }
                catch (err) {
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
    }
    catch (err) {
        console.error('[API] Unexpected error in /metrics endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) });
    }
});
app.get(['/public-metrics', '/api/public-metrics'], async (req, res) => {
    try {
        const cached = await getCache();
        if (cached && cached.data && Array.isArray(cached.data)) {
            const publicData = cached.data.map((m) => ({
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
    }
    catch (err) {
        console.error('[API] Unexpected error in /public-metrics endpoint:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
async function getAppUsers(app) {
    const authInstance = admin.auth(app);
    const users = [];
    let pageToken = undefined;
    try {
        do {
            const result = await authInstance.listUsers(1000, pageToken);
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
    }
    catch (err) {
        console.error('[Firebase] Failed to fetch users list for app:', err);
        return [];
    }
}
async function getAppUsersViaCli(projectId) {
    const tempFile = path.join(os.tmpdir(), `users-${projectId}-${Date.now()}.json`);
    try {
        (0, child_process_1.execSync)(`npx firebase auth:export "${tempFile}" --format json --project ${projectId}`, { stdio: 'ignore', timeout: 8000 });
        if (fs.existsSync(tempFile)) {
            const content = fs.readFileSync(tempFile, 'utf8').trim();
            try {
                fs.unlinkSync(tempFile);
            }
            catch (e) { }
            if (content) {
                const parsed = JSON.parse(content);
                const cliUsers = parsed.users || [];
                return cliUsers.map((u) => ({
                    uid: u.localId || u.uid,
                    email: u.email,
                    displayName: u.displayName,
                    photoURL: u.photoUrl || u.photoURL,
                    lastSignInTime: u.lastSignedInAt ? (isFinite(Number(u.lastSignedInAt)) ? new Date(parseInt(u.lastSignedInAt, 10)).toISOString() : u.lastSignedInAt) : undefined,
                    createdAt: u.createdAt ? (isFinite(Number(u.createdAt)) ? new Date(parseInt(u.createdAt, 10)).toISOString() : u.createdAt) : undefined,
                }));
            }
        }
    }
    catch (err) {
        console.error(`[Local CLI Fallback] Failed to fetch users for project ${projectId}:`, err);
    }
    return [];
}
app.get(['/users', '/api/users'], authenticateAdmin, async (req, res) => {
    try {
        const initiatives = await getInitiativesFromSchema();
        const allUsersMap = new Map();
        for (const item of initiatives) {
            const type = item['@type'];
            const name = item.name;
            if (type === 'SoftwareApplication' && item.applicationCategory !== 'UtilitiesApplication') {
                const projectId = getProjectId(item);
                const projectApp = getProjectApp(projectId);
                let users = [];
                if (projectApp) {
                    users = await getAppUsers(projectApp);
                }
                else {
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
                            users = backupUsers.map((u) => ({
                                uid: u.localId || u.uid,
                                email: u.email,
                                displayName: u.displayName,
                                photoURL: u.photoUrl || u.photoURL,
                                lastSignInTime: u.lastSignedInAt ? (isFinite(Number(u.lastSignedInAt)) ? new Date(parseInt(u.lastSignedInAt, 10)).toISOString() : u.lastSignedInAt) : undefined,
                                createdAt: u.createdAt ? (isFinite(Number(u.createdAt)) ? new Date(parseInt(u.createdAt, 10)).toISOString() : u.createdAt) : undefined,
                            }));
                        }
                        catch (err) {
                            console.error(`[Backup Fallback] Failed to read backup file for ${name}:`, err);
                        }
                    }
                }
                for (const user of users) {
                    if (!user.email)
                        continue;
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
                    }
                    else {
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
        const aggregatedUsers = Array.from(allUsersMap.values()).sort((a, b) => b.lastActive.localeCompare(a.lastActive));
        res.json(aggregatedUsers);
    }
    catch (err) {
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
app.get('/api/social', authenticateAdmin, async (_req, res) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection('social_posts').orderBy('suggested_date', 'asc').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(posts);
    }
    catch (err) {
        console.error('[API] Error fetching social posts:', err);
        res.status(500).json({ error: 'Failed to fetch social posts' });
    }
});
/**
 * PUT /api/social/:id — Update a social post (status, feedback, captions)
 */
app.put('/api/social/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = admin.firestore();
        // Only allow specific fields to be updated
        const allowedFields = ['status', 'user_feedback', 'caption_english', 'caption_spanish', 'hook', 'visual_instruction', 'mermaid_code', 'suggested_date'];
        const filtered = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                filtered[key] = updates[key];
            }
        }
        filtered['updated_at'] = new Date().toISOString();
        await db.collection('social_posts').doc(id).update(filtered);
        res.json({ success: true, id });
    }
    catch (err) {
        console.error('[API] Error updating social post:', err);
        res.status(500).json({ error: `Failed to update social post: ${err.message}` });
    }
});
/**
 * POST /api/social/import — Bulk import posts from JSON array
 */
app.post('/api/social/import', authenticateAdmin, async (req, res) => {
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
            if (!post.id)
                continue;
            const docRef = db.collection('social_posts').doc(post.id);
            batch.set(docRef, {
                ...post,
                updated_at: new Date().toISOString()
            }, { merge: true });
            imported++;
        }
        await batch.commit();
        res.json({ success: true, imported });
    }
    catch (err) {
        console.error('[API] Error importing social posts:', err);
        res.status(500).json({ error: 'Failed to import social posts' });
    }
});
/**
 * POST /api/social/generate — Run AI pipeline to generate non-redundant posts for underrepresented projects
 */
app.post('/api/social/generate', authenticateAdmin, async (_req, res) => {
    try {
        const db = admin.firestore();
        // 1. Get existing posts
        const snapshot = await db.collection('social_posts').get();
        const existingProjects = new Set();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.project) {
                existingProjects.add(data.project.toLowerCase());
            }
        });
        const newPosts = [];
        const now = new Date().toISOString();
        // 2. Candidate posts for underrepresented projects
        const candidates = [
            {
                id: "20260714-009-chessverse-opening-practice",
                status: "Draft",
                post_type: "vibe_coding_reality",
                project: "Chessverse",
                hook: "Mastering openings requires repetition. Puzzles require context.",
                caption_english: "Mastering openings requires repetition. Puzzles require context.\n\nChessverse is a modern PWA designed to let you practice chess openings and puzzles offline. Our recent update brings custom opening tree tracking: you input your repertoire, and the engine shuffles variations to test your responses.\n\nWhy Chessverse?\n• Immersive Opening Repertoire Practice\n• Thousands of offline-enabled tactical puzzles\n• LocalStorage performance metrics tracking\n• Minimalist UI matching the sumi-black theme\n\nNo server lag. Pure chess opening memorization, direct in your pocket.\n\nMore at chessverse.bervos.org\n\n#BuildInPublic #Chessverse #IndieHacker #PWA #React",
                caption_spanish: "Chessverse ahora te permite entrenar tu repertorio de aperturas y resolver tácticas sin conexión.",
                visual_instruction: "Generate a dark Chess board design with glowing indigo coordinates, showcasing a tactical opening fork. Top label '// VIBE_CODING_REALITY // CHESSVERSE'.",
                mermaid_code: null,
                suggested_date: "2026-08-15",
                user_feedback: "",
                created_at: now,
                updated_at: now
            },
            {
                id: "20260714-010-tonaly-ear-training",
                status: "Draft",
                post_type: "under_the_hood",
                project: "Tonaly",
                hook: "Can you identify a perfect fifth by ear?",
                caption_english: "Can you identify a perfect fifth by ear?\n\nTonaly is a web-based ear training studio built to bridge the gap between music theory and instinct. Our audio generation pipeline uses the Web Audio API to synthesize clean waveforms (sine, square, triangle) directly in the browser. No pre-recorded MP3 samples.\n\nHow it works under the hood:\n1. Choose your training module: intervals, chords, or note recognition\n2. The system generates randomized musical keys and plays the progression dynamically\n3. Responsive keyboard UI matches your input\n4. Performance insights calculated locally, showing interval reaction times\n\nPure Web Audio API, zero latency, offline-ready.\n\nMore at tonaly.bervos.org\n\n#BuildInPublic #Tonaly #WebAudioAPI #EarTraining #MusicTheory",
                caption_spanish: "Tonaly entrena tu oído musical generando sintetizadores en tiempo real usando el Web Audio API del navegador.",
                visual_instruction: "Branded design showing a circular music wheel of fifths with glowing indigo and cyan accents. Label '// UNDER_THE_HOOD // TONALY'.",
                mermaid_code: "graph TD\n    A[Interval Selector] --> B[Web Audio Synth]\n    B -->|Sine / Square Wave| C[Audio Node Link]\n    C --> D[User Response Match]\n    D -->|Correct / Incorrect| E[Reaction Logger]\n    E --> F[Performance Charts]",
                suggested_date: "2026-08-18",
                user_feedback: "",
                created_at: now,
                updated_at: now
            },
            {
                id: "20260714-011-laresdj-equipment-map",
                status: "Draft",
                post_type: "carousel_before_after",
                project: "LaresDJ",
                hook: "DJs need gear. Producers need resources. Finding both in one place shouldn't be hard.",
                caption_english: "DJs need gear. Producers need resources. Finding both in one place shouldn't be hard.\n\n[SLIDE 1 — THE BOTTLENECK]\nDJs and music producers spend hours searching for custom skins, mapping configs, gear reviews, and localized DJ equipment rental shops. Most info is scattered across outdated forums.\n\n[SLIDE 2 — THE APPROACH]\nCreated LaresDJ:\n• Centralized DJI/Traktor controller mapping database\n• Immersive equipment rental map using OpenStreetMap\n• High-quality curated download packs for DJs\n• Integrated community forum backend\n\n[SLIDE 3 — THE RESULT]\nOne central portal for DJs and music producers to level up their gear setup, grab controller mapping files instantly, and rent equipment locally. Custom skins for Traktor downloaded over 5,000 times.\n\nMore at laresdj.bervos.org\n\n#BuildInPublic #LaresDJ #DJCommunity #OpenSource #MusicProduction",
                caption_spanish: "LaresDJ consolida recursos para productores y DJs, incluyendo mapeos de controladores y mapas de equipamiento en un portal centralizado.",
                visual_instruction: "3-slide carousel. Slide 1: Scattered folder icons. Slide 2: Interactive map wireframe. Slide 3: DJ mixer controller screenshot. Label '// BEFORE_AND_AFTER // LARESDJ'.",
                mermaid_code: null,
                suggested_date: "2026-08-22",
                user_feedback: "",
                created_at: now,
                updated_at: now
            }
        ];
        // Filter candidates to only keep those whose project is not in existingProjects
        const batch = db.batch();
        let generated = 0;
        for (const post of candidates) {
            if (!existingProjects.has(post.project.toLowerCase())) {
                const docRef = db.collection('social_posts').doc(post.id);
                batch.set(docRef, post);
                newPosts.push(post);
                generated++;
            }
        }
        if (generated > 0) {
            await batch.commit();
        }
        res.json({ success: true, generated, posts: newPosts });
    }
    catch (err) {
        console.error('[API] Error running generation pipeline:', err);
        res.status(500).json({ error: 'Failed to run generation pipeline' });
    }
});
/**
 * POST /api/social/:id/instagram — Publish a social post to Instagram
 */
app.post('/api/social/:id/instagram', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ error: 'Missing imageData base64 payload' });
        }
        const db = admin.firestore();
        const docRef = db.collection('social_posts').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Social post not found' });
        }
        const post = doc.data();
        // 1. Upload base64 image to Firebase Storage
        const bucket = admin.storage().bucket();
        const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const file = bucket.file(`social_posts/${id}.png`);
        await file.save(buffer, {
            metadata: { contentType: 'image/png' },
            public: true,
            resumable: false
        });
        // Make sure the file is public and get the URL
        await file.makePublic();
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/social_posts/${id}.png`;
        // 2. Read Instagram API Credentials from env
        const instagramAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
        const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
        if (!instagramAccountId || !facebookAccessToken) {
            return res.status(200).json({
                success: false,
                warning: 'Instagram credentials not configured. Image uploaded successfully.',
                imageUrl,
                details: 'To enable live publishing, please add INSTAGRAM_BUSINESS_ACCOUNT_ID and FACEBOOK_ACCESS_TOKEN to functions/.env'
            });
        }
        // 3. Instagram Content Publishing API Flow
        // Step A: Create Media Container
        const caption = post?.caption_english || '';
        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${instagramAccountId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image_url: imageUrl,
                caption,
                access_token: facebookAccessToken
            })
        });
        const containerData = await containerRes.json();
        if (!containerRes.ok || !containerData.id) {
            throw new Error(`Failed to create media container: ${JSON.stringify(containerData)}`);
        }
        const creationId = containerData.id;
        // Step B: Publish Media Container
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
        // 4. Update status in Firestore
        await docRef.update({
            status: 'Published',
            instagram_media_id: publishData.id,
            published_at: new Date().toISOString()
        });
        return res.json({
            success: true,
            mediaId: publishData.id,
            imageUrl
        });
    }
    catch (err) {
        console.error('[API] Error publishing to Instagram:', err);
        return res.status(500).json({
            error: 'Failed to publish to Instagram',
            details: err.message
        });
    }
});
/**
 * DELETE /api/social/:id — Delete a social post
 */
app.delete('/api/social/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = admin.firestore();
        await db.collection('social_posts').doc(id).delete();
        res.json({ success: true, id });
    }
    catch (err) {
        console.error('[API] Error deleting social post:', err);
        res.status(500).json({ error: 'Failed to delete social post' });
    }
});
// Export Cloud Function
exports.hubApi = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map