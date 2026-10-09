(() => {
  const images = document.querySelectorAll('img[data-hero-depth]');
  if (!images.length) return;

  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();

  const reset = (state) => {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.bounds = null;
    state.image.classList.remove('is-depth-tracking');
    state.image.style.removeProperty('--hero-depth-x');
    state.image.style.removeProperty('--hero-depth-y');
  };

  const sync = (state) => {
    const enabled = pointer.matches && !reducedMotion.matches &&
      !document.hidden && state.visible;
    if (enabled === state.enabled) return;
    state.enabled = enabled;
    if (!enabled) {
      reset(state);
      state.image.classList.remove('is-depth-ready', 'is-depth-entering');
      return;
    }
    state.image.classList.add('is-depth-ready');
    if (!state.entered) {
      state.entered = true;
      state.image.classList.add('is-depth-entering');
    }
  };

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const state = states.get(entry.target);
        state.visible = entry.isIntersecting;
        sync(state);
      }
    })
    : null;

  for (const image of images) {
    const state = {
      image,
      visible: !observer,
      enabled: false,
      entered: false,
      bounds: null,
      frame: 0,
      x: 0,
      y: 0,
    };
    states.set(image, state);

    // The event path only stores coordinates; one frame consumes the latest pair.
    const render = () => {
      state.frame = 0;
      let x = -2 - state.y * 4;
      let y = -4 + state.x * 4;
      const angle = Math.hypot(x, y);
      if (angle > 8) {
        x *= 8 / angle;
        y *= 8 / angle;
      }
      image.style.setProperty('--hero-depth-x', `${x.toFixed(2)}deg`);
      image.style.setProperty('--hero-depth-y', `${y.toFixed(2)}deg`);
    };
    const move = (event) => {
      if (!state.enabled || event.pointerType === 'touch') return;
      if (!state.bounds) {
        // Read geometry only on entry (or the first move after a layout change).
        state.bounds = image.getBoundingClientRect();
        if (!state.bounds.width || !state.bounds.height) {
          state.bounds = null;
          return;
        }
        image.classList.remove('is-depth-entering');
        image.classList.add('is-depth-tracking');
      }
      state.x = Math.max(-1, Math.min(1,
        ((event.clientX - state.bounds.left) / state.bounds.width) * 2 - 1));
      state.y = Math.max(-1, Math.min(1,
        ((event.clientY - state.bounds.top) / state.bounds.height) * 2 - 1));
      if (!state.frame) state.frame = requestAnimationFrame(render);
    };

    image.addEventListener('pointerenter', move);
    image.addEventListener('pointermove', move);
    image.addEventListener('pointerleave', () => reset(state));
    image.addEventListener('pointercancel', () => reset(state));
    image.addEventListener('animationend', (event) => {
      if (event.animationName === 'hero-depth-enter')
        image.classList.remove('is-depth-entering');
    });
    if (observer) observer.observe(image);
    else sync(state);
  }

  const syncAll = () => {
    for (const state of states.values()) sync(state);
  };
  const resetAll = () => {
    for (const state of states.values()) reset(state);
  };
  pointer.addEventListener('change', syncAll);
  reducedMotion.addEventListener('change', syncAll);
  document.addEventListener('visibilitychange', syncAll);
  // Cached bounds cannot survive scrolling or resizing. These handlers do no rendering.
  addEventListener('scroll', resetAll, { passive: true });
  addEventListener('resize', resetAll, { passive: true });
  addEventListener('blur', resetAll);
  addEventListener('pagehide', resetAll);
})();
