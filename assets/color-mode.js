(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const registryUrl = new URL('themes/index.json', document.currentScript.src);
  const ready = document.readyState === 'loading'
    ? new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
    : Promise.resolve();
  const colorNames = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted',
    'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring',
    'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
    'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
  ];
  const cacheVersion = 2;
  const cacheKey = `docifly-palette:${registryUrl.href}`;
  const validColors = (colors) =>
    colors && typeof colors === 'object' && !Array.isArray(colors) &&
    Object.keys(colors).length === colorNames.length &&
    colorNames.every((name) => Object.hasOwn(colors, name) &&
      typeof colors[name] === 'string' && /^#[0-9a-f]{6}$/i.test(colors[name]));
  const stock = (id) => ({ id, scheme: id, palette: null });
  const paletteStyle = document.createElement('style');
  paletteStyle.media = 'screen';
  document.head.append(paletteStyle);
  const palettes = new Map();
  const setPalette = (theme, colors) => {
    // One synchronous update: no frame can observe a new scheme with an old palette.
    // Specificity beats the vendor's unlayered :root/.dark even before its link loads.
    paletteStyle.textContent = colors === null ? '' :
      `html:root, ::backdrop {${colorNames.map((name) => `--${name}: ${colors[name]};`).join('')}}`;
    root.classList.toggle('dark', theme.scheme === 'dark');
    root.dataset.theme = theme.id;
    root.dataset.colorScheme = theme.scheme;
  };
  const useLight = () => {
    setPalette(stock('light'), null);
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      /* Storage is optional. */
    }
  };
  let savedPreference;
  try {
    savedPreference = localStorage.getItem('starlight-theme');
  } catch {
    /* A denied preference must not prevent Auto or fresh colors. */
  }
  const initialId = !savedPreference || savedPreference === 'auto'
    ? (system.matches ? 'dark' : 'light') : savedPreference;
  if (initialId === 'light' || initialId === 'dark') {
    // Stock schemes need no JSON snapshot to restore before the first paint.
    setPalette(stock(initialId), null);
  } else {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached?.version === cacheVersion && cached.id === initialId &&
          /^[a-z][a-z0-9-]*$/.test(cached.id) &&
          ['light', 'dark'].includes(cached.scheme) && validColors(cached.colors)) {
        setPalette(cached, cached.colors);
      }
    } catch {
      /* Invalid, obsolete, or blocked snapshots never prevent fresh loading. */
    }
  }
  let revision = 0;
  const loadPalette = (theme) => {
    if (theme.palette === null) return Promise.resolve(null);
    if (!palettes.has(theme.id)) {
      palettes.set(theme.id, fetch(new URL(theme.palette, registryUrl)).then(async (response) => {
        if (!response.ok) throw new Error(`${theme.id} palette: HTTP ${response.status}`);
        const colors = await response.json();
        if (!validColors(colors)) {
          throw new Error(`${theme.id} palette must define exactly the ${colorNames.length} semantic six-digit hex colors`);
        }
        return colors;
      }));
    }
    return palettes.get(theme.id);
  };

  const initialize = async () => {
    const response = await fetch(registryUrl);
    if (!response.ok) throw new Error(`Theme registry: HTTP ${response.status}`);
    const entries = await response.json();
    if (!Array.isArray(entries) || !entries.every((theme) =>
      theme && typeof theme === 'object' &&
      typeof theme.id === 'string' && /^[a-z][a-z0-9-]*$/.test(theme.id) && theme.id !== 'auto' &&
      typeof theme.label === 'string' && theme.label.trim().length > 0 &&
      ['light', 'dark'].includes(theme.scheme) &&
      (['light', 'dark'].includes(theme.id)
        ? theme.palette === null && theme.scheme === theme.id
        : typeof theme.palette === 'string' && theme.palette.trim().length > 0))) {
      throw new Error('Invalid theme registry');
    }
    const themes = new Map(entries.map((theme) => [theme.id, theme]));
    if (themes.size !== entries.length || !themes.has('light') || !themes.has('dark')) {
      throw new Error('Theme registry requires unique IDs and stock Light and Dark');
    }
    const parse = (value) => themes.has(value) ? value : 'auto';
    let preference = parse(savedPreference);
    const apply = async () => {
      const current = ++revision;
      const id = preference === 'auto' ? (system.matches ? 'dark' : 'light') : preference;
      const theme = themes.get(id);
      try {
        const colors = await loadPalette(theme);
        if (current !== revision) return;
        setPalette(theme, colors);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ version: cacheVersion, id, scheme: theme.scheme, colors }));
        } catch {
          /* Switching still works without a persistent pre-paint snapshot. */
        }
      } catch (error) {
        if (current !== revision) return;
        useLight();
        console.error(`Unable to load the ${id} palette; using light colors.`, error);
      }
    };
    void apply();
    system.addEventListener('change', () => {
      if (preference === 'auto') void apply();
    });
    await ready;
    const picker = document.getElementById('mode-picker');
    const select = document.getElementById('color-mode');
    if (!picker || !(select instanceof HTMLSelectElement)) return;
    const icon = picker.querySelector('svg path');
    const icons = {
      auto: 'M4 4h16v12H4z M1 20h22 M9 16v4m6-4v4',
      light:
        'M12 3V1m0 22v-2M3 12H1m22 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4m-12.8 0-1.4 1.4M19.8 4.2l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
      dark: 'M20.8 14.2A9 9 0 0 1 9.8 3.2 9 9 0 1 0 20.8 14.2Z',
    };
    for (const theme of entries) {
      const label = select.getAttribute(`data-label-${theme.id}`) || theme.label;
      select.add(new Option(label, theme.id), select.options.length - 1);
    }
    const updatePicker = () => {
      select.value = preference;
      icon?.setAttribute('d', icons[preference === 'auto' ? 'auto' : themes.get(preference).scheme]);
    };
    updatePicker();
    select.addEventListener('change', () => {
      preference = parse(select.value);
      void apply();
      updatePicker();
      try {
        if (preference === 'auto') localStorage.removeItem('starlight-theme');
        else localStorage.setItem('starlight-theme', preference);
      } catch {
        /* This page still honors changes when persistence is denied. */
      }
    });
    picker.hidden = false;
  };
  void initialize().catch((error) => {
    useLight();
    console.error('Unable to load the theme registry; using light colors.', error);
  });
})();
