(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const paletteUrl = new URL('themes/dark.json', document.currentScript.src);
  const colorNames = [
    'primary', 'primary-alt', 'secondary', 'secondary-alt',
    'body-text', 'strong-text', 'muted-text', 'bg', 'bg-alt',
  ];
  const paletteStyle = document.createElement('style');
  paletteStyle.media = 'not all';
  document.head.append(paletteStyle);
  let darkPalette;
  let revision = 0;
  const loadDarkPalette = () => {
    darkPalette ??= fetch(paletteUrl).then(async (response) => {
      if (!response.ok) throw new Error(`Dark palette: HTTP ${response.status}`);
      const colors = await response.json();
      if (!colors || Object.keys(colors).length !== colorNames.length ||
          !colorNames.every((name) => /^#[0-9a-f]{6}$/i.test(colors[name]))) {
        throw new Error('Dark palette must define the nine base hex colors');
      }
      return `:root, ::backdrop {${colorNames.map(
        (name) => `--brand-${name}: ${colors[name]};`
      ).join('')}}`;
    });
    return darkPalette;
  };
  const parse = (value) => (value === 'light' || value === 'dark' ? value : 'auto');
  let preference = 'auto';
  try {
    preference = parse(localStorage.getItem('starlight-theme'));
  } catch {
    /* Keep an in-memory preference if storage is unavailable. */
  }
  const apply = async () => {
    const current = ++revision;
    const theme = preference === 'auto' ? (system.matches ? 'dark' : 'light') : preference;
    if (theme === 'dark') {
      try {
        const css = await loadDarkPalette();
        if (current !== revision) return;
        paletteStyle.textContent = css;
        paletteStyle.media = 'screen';
        root.dataset.theme = 'dark';
      } catch (error) {
        if (current !== revision) return;
        paletteStyle.media = 'not all';
        root.dataset.theme = 'light';
        console.error('Unable to load the dark palette; using light colors.', error);
      }
    } else {
      paletteStyle.media = 'not all';
      root.dataset.theme = 'light';
    }
  };
  void apply();
  system.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
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
    const updatePicker = () => {
      select.value = preference;
      icon?.setAttribute('d', icons[preference]);
    };
    updatePicker();
    select.addEventListener('change', () => {
      preference = parse(select.value);
      apply();
      updatePicker();
      try {
        if (preference === 'auto') localStorage.removeItem('starlight-theme');
        else localStorage.setItem('starlight-theme', preference);
      } catch {
        /* This tab still honors changes when persistence is denied. */
      }
    });
    picker.hidden = false;
  });
})();
