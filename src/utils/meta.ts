export interface MetaTagsOptions {
  title?: string;
  description?: string;
  favicon?: string;
  appleTouchIcon?: string;
  appName?: string;
  ogImage?: string;
  url?: string;
}

const DEFAULT_META: Required<MetaTagsOptions> = {
  title: 'BERVOS | Digital Solutions, Systems & Open Source',
  description: 'BERVOS - A family of flexible digital solutions, systems, and open-source packages designed to learn, drive true action, and optimize growth. Built by Bernardo Lares.',
  favicon: '/favicon.svg',
  appleTouchIcon: '/apple-touch-icon.png',
  appName: 'BERVOS',
  ogImage: 'https://bervos.org/logo-white.png',
  url: 'https://bervos.org/'
};

export const updatePageMetadata = (options: MetaTagsOptions = {}) => {
  const meta = { ...DEFAULT_META, ...options };

  // 1. Title
  document.title = meta.title;

  // 2. Favicon
  let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = meta.favicon;
  favicon.type = meta.favicon.endsWith('.png') ? 'image/png' : 'image/svg+xml';

  // 3. Apple Touch Icon (Home Screen Icon)
  let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = meta.appleTouchIcon;

  // 4. Apple Mobile Web App Title
  let appleTitle = document.querySelector("meta[name='apple-mobile-web-app-title']") as HTMLMetaElement | null;
  if (!appleTitle) {
    appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitle);
  }
  appleTitle.content = meta.appName;

  // 5. Application Name
  let appNameMeta = document.querySelector("meta[name='application-name']") as HTMLMetaElement | null;
  if (!appNameMeta) {
    appNameMeta = document.createElement('meta');
    appNameMeta.name = 'application-name';
    document.head.appendChild(appNameMeta);
  }
  appNameMeta.content = meta.appName;

  // 6. Meta Description
  let metaDesc = document.getElementById('meta-description') as HTMLMetaElement | null;
  if (!metaDesc) {
    metaDesc = document.querySelector("meta[name='description']");
  }
  if (metaDesc) {
    metaDesc.content = meta.description;
  }

  // 7. Canonical Link
  let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = meta.url;

  // 8. OpenGraph & Twitter
  const setMetaProperty = (prop: string, val: string) => {
    let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.content = val;
  };

  const setMetaName = (name: string, val: string) => {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = val;
  };

  setMetaProperty('og:title', meta.title);
  setMetaProperty('og:description', meta.description);
  setMetaProperty('og:image', meta.ogImage);
  setMetaProperty('og:url', meta.url);

  setMetaName('twitter:title', meta.title);
  setMetaName('twitter:description', meta.description);
  setMetaName('twitter:image', meta.ogImage);

  return () => {
    // Cleanup / reset to default BERVOS metadata
    document.title = DEFAULT_META.title;
    if (favicon) {
      favicon.href = DEFAULT_META.favicon;
      favicon.type = 'image/svg+xml';
    }
    if (appleTouchIcon) appleTouchIcon.href = DEFAULT_META.appleTouchIcon;
    if (appleTitle) appleTitle.content = DEFAULT_META.appName;
    if (appNameMeta) appNameMeta.content = DEFAULT_META.appName;
    if (metaDesc) metaDesc.content = DEFAULT_META.description;
    if (canonical) canonical.href = DEFAULT_META.url;

    setMetaProperty('og:title', DEFAULT_META.title);
    setMetaProperty('og:description', DEFAULT_META.description);
    setMetaProperty('og:image', DEFAULT_META.ogImage);
    setMetaProperty('og:url', DEFAULT_META.url);

    setMetaName('twitter:title', DEFAULT_META.title);
    setMetaName('twitter:description', DEFAULT_META.description);
    setMetaName('twitter:image', DEFAULT_META.ogImage);
  };
};
