export const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'intermediate', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'nav-before', width: 799, height: 768 },
  { name: 'nav-after', width: 800, height: 768 },
  { name: 'toc-before', width: 1151, height: 900 },
  { name: 'toc-after', width: 1152, height: 900 },
];

export const modes = ['light', 'dark'];

export const installations = [
  { name: 'root', base: '' },
  { name: 'prefix', base: '/docs' },
];

export const pages = [
  { name: 'overview', path: '/' },
  { name: 'long-guide', path: '/guides/long-guide/' },
  { name: 'code', path: '/reference/code-examples/' },
];

export const featurePages = [
  { name: 'cards', path: '/cards/' },
  { name: 'callouts', path: '/callouts/' },
  { name: 'link-buttons', path: '/link-buttons/' },
  { name: 'badges', path: '/badges/' },
  { name: 'steps', path: '/steps/' },
  { name: 'file-trees', path: '/file-trees/' },
  { name: 'icons', path: '/icons/' },
  { name: 'tabs', path: '/tabs/' },
  { name: 'tabs-restoration', path: '/tabs-restoration/' },
  { name: 'splash', path: '/minimal-hero/' },
  { name: 'not-found', path: '/404.html' },
];

export const localizedInstallations = [
  { name: 'localized-root', base: '/localized' },
  { name: 'localized-prefix', base: '/localized/docs' },
];

export const urlFor = (installation, page) =>
  `${installation.base}${page.path}`.replace(/\/{2,}/g, '/');
