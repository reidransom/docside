(() => {
  if (!('onpagereveal' in window)) return;

  // Register in the head: pagereveal can precede deferred scripts.
  // A consumer may link to the same route more than once; capture one visible link.
  const markCurrent = () => {
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    nav.querySelector('[data-reading-marker]')?.removeAttribute('data-reading-marker');
    for (const link of nav.querySelectorAll('a[aria-current="page"]')) {
      if (link.getClientRects().length) {
        link.setAttribute('data-reading-marker', '');
        break;
      }
    }
  };
  document.addEventListener('DOMContentLoaded', markCurrent);
  addEventListener('pageswap', markCurrent);
  addEventListener('pagereveal', markCurrent);
})();
