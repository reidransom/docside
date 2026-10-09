(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.getElementById('global-controls');
    const header = document.querySelector('header');
    const nav = document.getElementById('site-nav');
    const menuToggle = document.getElementById('menu-toggle');
    if (!controls || !header || !nav || !menuToggle) return;

    const desktop = {
      get matches() {
        return getComputedStyle(menuToggle).display === 'none';
      },
    };
    const placeControls = () => {
      const destination = desktop.matches ? header : nav;
      if (controls.parentElement === destination) return;
      const focused = controls.contains(document.activeElement) ? document.activeElement : null;
      destination.append(controls);
      if (focused instanceof HTMLElement) {
        if (desktop.matches) focused.focus();
        else menuToggle?.focus();
      }
    };

    placeControls();
    addEventListener('resize', placeControls);
    new ResizeObserver(placeControls).observe(menuToggle);
  });
})();
