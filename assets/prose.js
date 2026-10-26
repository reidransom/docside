(() => {
  const anchorLabel = document.documentElement.dataset.anchorLabel;
  if (!anchorLabel) return;
  document.querySelectorAll('#article :is(h1, h2, h3, h4, h5, h6)[id]').forEach((heading) => {
    if (
      heading.parentElement.classList.contains('sl-heading-wrapper') ||
      !heading.textContent.trim()
    )
      return;
    const badgeContainer = heading.nextElementSibling;
    const headingBadge =
      badgeContainer instanceof HTMLParagraphElement &&
      badgeContainer.childElementCount === 1 &&
      badgeContainer.firstElementChild?.matches('.sl-badge') &&
      badgeContainer.textContent.trim() === badgeContainer.firstElementChild.textContent.trim()
        ? badgeContainer.firstElementChild
        : null;
    const wrapper = document.createElement('div');
    wrapper.className = 'sl-heading-wrapper level-' + heading.tagName.toLowerCase();
    const link = document.createElement('a');
    link.className = 'sl-anchor-link';
    link.href = '#' + encodeURIComponent(heading.id);
    link.setAttribute('aria-label', anchorLabel.replace('{title}', () => heading.textContent.trim()));
    const icon = document.createElement('span');
    icon.className = 'sl-anchor-icon';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute(
      'd',
      'm12.11 15.39-3.88 3.88a2.52 2.52 0 0 1-3.5 0 2.47 2.47 0 0 1 0-3.5l3.88-3.88a1 1 0 1 0-1.42-1.42l-3.88 3.89a4.48 4.48 0 0 0 6.33 6.33l3.89-3.88a1 1 0 0 0-1.42-1.42m8.58-12.08a4.49 4.49 0 0 0-6.33 0l-3.89 3.88a1 1 0 1 0 1.42 1.42l3.88-3.88a2.52 2.52 0 0 1 3.5 0 2.47 2.47 0 0 1 0 3.5l-3.88 3.88a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l3.88-3.89a4.49 4.49 0 0 0 0-6.33M8.83 15.17a1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29l4.92-4.92a1 1 0 1 0-1.42-1.42l-4.92 4.92a1 1 0 0 0 0 1.42',
    );
    svg.append(path);
    icon.append(svg);
    link.append(icon);
    heading.before(wrapper);
    wrapper.append(heading);
    if (headingBadge) {
      wrapper.append(headingBadge);
      badgeContainer.remove();
    }
    wrapper.append(link);
  });
})();
