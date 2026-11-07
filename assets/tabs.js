(() => {
  const groupElements = Array.from(document.querySelectorAll('[data-tabs]'));
  if (!groupElements.length) return;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'summary',
    '[contenteditable]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const storagePrefix = 'docside-tabs:v1:';
  const activeBySync = new Map();
  const groupsBySync = new Map();

  const groups = groupElements.map((element, groupIndex) => {
    const items = Array.from(element.children).filter((child) => child.matches('.tab-item'));
    const sync = element.getAttribute('data-tabs-sync') || '';
    const group = {
      element,
      groupIndex,
      items,
      labels: items.map(
        (item) => item.querySelector(':scope > .tab-item-label > .tab-label-text')?.textContent || '',
      ),
      sync,
      persist: element.hasAttribute('data-tabs-persist') && Boolean(sync),
      tabs: [],
      panels: [],
    };
    if (sync) {
      const synced = groupsBySync.get(sync) || [];
      synced.push(group);
      groupsBySync.set(sync, synced);
    }
    return group;
  });

  for (const [sync, synced] of groupsBySync) {
    if (!synced.some((group) => group.persist)) continue;
    try {
      const stored = localStorage.getItem(storagePrefix + sync);
      if (stored) activeBySync.set(sync, stored);
    } catch {
      /* Persistence is optional; all panels remain available. */
    }
  }

  const persist = (sync, label) => {
    if (!groupsBySync.get(sync)?.some((group) => group.persist)) return;
    try {
      localStorage.setItem(storagePrefix + sync, label);
    } catch {
      /* Keep synchronized in-memory behavior when storage is unavailable. */
    }
  };

  const applySelection = (group, index, { focus = false, synchronize = false } = {}) => {
    const tab = group.tabs[index];
    const panel = group.panels[index];
    if (!tab || !panel) return;
    const previousTop = group.element.getBoundingClientRect().top;
    group.tabs.forEach((candidate, candidateIndex) => {
      const selected = candidateIndex === index;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      group.panels[candidateIndex].hidden = !selected;
    });
    if (focus) {
      tab.focus({ preventScroll: true });
      // Reveal long labels only inside their list, without moving the document.
      const list = tab.parentElement;
      const bounds = list.getBoundingClientRect();
      const labelBounds = tab.getBoundingClientRect();
      if (labelBounds.left < bounds.left) list.scrollBy({ left: labelBounds.left - bounds.left, behavior: 'instant' });
      else if (labelBounds.right > bounds.right) list.scrollBy({ left: labelBounds.right - bounds.right, behavior: 'instant' });
    }

    if (synchronize && group.sync) {
      const label = group.labels[index];
      activeBySync.set(group.sync, label);
      for (const receiver of groupsBySync.get(group.sync) || []) {
        if (receiver === group) continue;
        const receiverIndex = receiver.labels.indexOf(label);
        if (receiverIndex !== -1) applySelection(receiver, receiverIndex);
      }
      persist(group.sync, label);
      const offset = group.element.getBoundingClientRect().top - previousTop;
      if (offset) window.scrollTo({ top: window.scrollY + offset, behavior: 'instant' });
    }
  };

  groups.forEach((group) => {
    if (!group.items.length) return;
    if (group.sync && !activeBySync.has(group.sync)) activeBySync.set(group.sync, group.labels[0]);

    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-orientation', 'horizontal');

    group.items.forEach((item, itemIndex) => {
      const heading = item.querySelector(':scope > .tab-item-label');
      const panel = item.querySelector(':scope > .tab-panel');
      if (!(heading instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;
      const tabId = `docside-tab-${group.groupIndex}-${itemIndex}`;
      const panelId = `docside-tab-panel-${group.groupIndex}-${itemIndex}`;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.id = tabId;
      tab.append(...heading.childNodes);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panelId);
      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId);
      const hasFocusableContent = Array.from(panel.querySelectorAll(focusableSelector)).some(
        (candidate) => candidate.tabIndex >= 0 && !candidate.closest('[hidden], [inert]') && candidate.getClientRects().length,
      );
      if (!hasFocusableContent) panel.tabIndex = 0;
      heading.hidden = true;
      heading.textContent = group.labels[itemIndex];
      group.element.append(heading, panel);
      item.remove();
      tablist.append(tab);
      group.tabs.push(tab);
      group.panels.push(panel);

      tab.addEventListener('click', () => {
        const index = group.tabs.indexOf(tab);
        if (index !== -1) applySelection(group, index, { focus: true, synchronize: true });
      });
      tab.addEventListener('keydown', (event) => {
        const index = group.tabs.indexOf(tab);
        const rtl = getComputedStyle(group.element).direction === 'rtl';
        let nextIndex;
        if (event.key === 'ArrowLeft')
          nextIndex = (index + (rtl ? 1 : -1) + group.tabs.length) % group.tabs.length;
        else if (event.key === 'ArrowRight')
          nextIndex = (index + (rtl ? -1 : 1) + group.tabs.length) % group.tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = group.tabs.length - 1;
        else return;
        event.preventDefault();
        applySelection(group, nextIndex, { focus: true, synchronize: true });
      });
    });

    if (!group.tabs.length) return;
    group.element.prepend(tablist);
    group.element.classList.add('tabs');
    const synchronizedLabel = group.sync ? activeBySync.get(group.sync) : undefined;
    const initialIndex = synchronizedLabel ? group.labels.indexOf(synchronizedLabel) : 0;
    applySelection(group, initialIndex === -1 ? 0 : initialIndex);
  });
})();
