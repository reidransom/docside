(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const registryUrl = new URL('themes/index.json', document.currentScript.src);
  const ready = document.readyState === 'loading'
    ? new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
    : Promise.resolve();
  const baseColorNames = ['primary', 'secondary', 'body-text', 'bg'];
  const colorNames = [
    ...baseColorNames, 'primary-alt', 'secondary-alt', 'strong-text', 'muted-text', 'bg-alt',
  ];
  const cacheKey = `docifly-palette:${registryUrl.href}`;
  const validColors = (colors, scheme) =>
    colors && typeof colors === 'object' && !Array.isArray(colors) &&
    (scheme === 'dark' ? baseColorNames : colorNames).every((name) => Object.hasOwn(colors, name)) &&
    Object.entries(colors).every(([name, color]) =>
      colorNames.includes(name) && /^#[0-9a-f]{6}$/i.test(color));
  const paletteStyle = document.createElement('style');
  paletteStyle.media = 'screen';
  document.head.append(paletteStyle);
  const palettes = new Map();
  const setPalette = (theme, colors) => {
    const declarations = colors === null ? '' :
      Object.entries(colors).map(([name, color]) => `--brand-${name}: ${color};`).join('');
    paletteStyle.textContent = `:root, ::backdrop {color-scheme: ${theme.scheme};${declarations}}` +
      ':root {background-color: var(--brand-bg);}';
    root.dataset.theme = theme.id;
    root.dataset.colorScheme = theme.scheme;
  };
  const useLight = () => {
    paletteStyle.textContent = '';
    root.dataset.theme = 'light';
    root.dataset.colorScheme = 'light';
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      /* Storage is optional. */
    }
  };
  let savedPreference;
  try {
    savedPreference = localStorage.getItem('starlight-theme');
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    const id = !savedPreference || savedPreference === 'auto'
      ? (system.matches ? 'dark' : 'light') : savedPreference;
    if (cached?.id === id && ['light', 'dark'].includes(cached.scheme) &&
        ((id === 'light' && cached.scheme === 'light' && cached.colors === null) ||
          validColors(cached.colors, cached.scheme))) {
      setPalette(cached, cached.colors);
    }
  } catch {
    /* Missing, invalid, or blocked storage must not prevent loading fresh colors. */
  }
  let revision = 0;
  const loadPalette = (theme) => {
    if (theme.palette === null) return Promise.resolve(null);
    if (!palettes.has(theme.id)) {
      palettes.set(theme.id, fetch(new URL(theme.palette, registryUrl)).then(async (response) => {
        if (!response.ok) throw new Error(`${theme.id} palette: HTTP ${response.status}`);
        const colors = await response.json();
        if (!validColors(colors, theme.scheme)) {
          throw new Error(`${theme.id} palette must define four base hex colors; light palettes also require all five variants`);
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
      /^[a-z][a-z0-9-]*$/.test(theme.id) && theme.id !== 'auto' &&
      typeof theme.label === 'string' && theme.label.length > 0 &&
      ['light', 'dark'].includes(theme.scheme) &&
      (theme.palette === null || typeof theme.palette === 'string'))) {
      throw new Error('Invalid theme registry');
    }
    const themes = new Map(entries.map((theme) => [theme.id, theme]));
    if (themes.size !== entries.length || !themes.has('light') || !themes.has('dark') ||
        themes.get('light').palette !== null) {
      throw new Error('Theme registry requires unique IDs, default Light, and Dark');
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
          localStorage.setItem(cacheKey, JSON.stringify({ id, scheme: theme.scheme, colors }));
        } catch {
          /* Theme switching still works without a persistent pre-paint palette. */
        }
      } catch (error) {
        if (current !== revision) return;
        useLight();
        console.error(`Unable to load the ${id} palette; using light colors.`, error);
      }
    };
    void apply();
    system.addEventListener('change', apply);
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
        /* This tab still honors changes when persistence is denied. */
      }
    });
    picker.hidden = false;
  };
  void initialize().catch((error) => {
    useLight();
    console.error('Unable to load the theme registry; using light colors.', error);
  });
})();
