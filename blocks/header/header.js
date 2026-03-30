import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Builds a promo card from a pipe-separated <p> containing picture|title|desc|cta|icon
 * @param {Element} p The paragraph element with promo content
 * @returns {Element} The promo card div
 */
function buildPromoCard(p) {
  const card = document.createElement('div');
  card.classList.add('mega-menu-promo');

  const picture = p.querySelector('picture');
  if (picture) card.append(picture.cloneNode(true));

  // Extract pipe-separated text parts from text nodes AFTER the picture
  const textParts = [];
  let afterPicture = false;
  p.childNodes.forEach((node) => {
    if (node === picture || node.contains?.(picture) || picture?.contains?.(node)) {
      afterPicture = true;
      return;
    }
    if (afterPicture && node.nodeType === Node.TEXT_NODE) {
      node.textContent.split('|').forEach((part) => {
        const trimmed = part.trim();
        if (trimmed) textParts.push(trimmed);
      });
    }
  });

  if (textParts.length >= 1) {
    const title = document.createElement('h4');
    title.classList.add('mega-menu-promo-title');
    [title.textContent] = textParts;
    card.append(title);
  }

  if (textParts.length >= 2) {
    const desc = document.createElement('p');
    desc.classList.add('mega-menu-promo-desc');
    [, desc.textContent] = textParts;
    card.append(desc);
  }

  // Find CTA link — skip links whose text contains | (they belong to the nav item)
  const allLinks = [...p.querySelectorAll('a')];
  const ctaLink = allLinks.find((a) => !a.textContent.includes('|'));
  if (ctaLink) {
    const cta = document.createElement('a');
    cta.href = ctaLink.href;
    cta.classList.add('mega-menu-promo-cta');
    cta.textContent = ctaLink.textContent;
    const arrow = p.querySelector('.icon-blue-arrow, .icon-link-arrow-right');
    if (arrow) {
      cta.append(arrow);
    } else {
      // Add arrow icon fallback
      const arrowImg = document.createElement('img');
      arrowImg.src = '/icons/link-arrow-right.svg';
      arrowImg.alt = '';
      arrowImg.classList.add('mega-menu-cta-arrow');
      cta.append(arrowImg);
    }
    card.append(cta);
  }

  return card;
}

/**
 * Builds a mega menu item from a link with pipe-separated title|description
 * @param {Element} link The anchor element
 * @returns {Element} The menu item li
 */
function buildMenuItem(link) {
  const menuItem = document.createElement('li');
  menuItem.classList.add('mega-menu-item');

  // Title from link text (before any |)
  const linkParts = link.textContent.split('|').map((s) => s.trim());
  const title = linkParts[0];
  let desc = linkParts[1] || '';

  // If no description in link text, check sibling text nodes in parent <li>
  if (!desc && link.parentElement) {
    link.parentElement.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/^\|/, '').trim();
        if (text) desc = text;
      }
    });
  }

  const itemLink = document.createElement('a');
  itemLink.href = link.href;

  const titleSpan = document.createElement('span');
  titleSpan.classList.add('mega-menu-item-title');
  titleSpan.textContent = title;
  itemLink.append(titleSpan);

  if (desc) {
    const descSpan = document.createElement('span');
    descSpan.classList.add('mega-menu-item-desc');
    descSpan.textContent = desc;
    itemLink.append(descSpan);
  }

  menuItem.append(itemLink);
  return menuItem;
}

/**
 * Transforms a nav dropdown <ul> into a styled mega menu
 * @param {Element} li The nav section <li> containing the dropdown
 * @param {Object|null} headerInfo Header bar info for grid-style menus
 */
function decorateMegaMenu(li, headerInfo) {
  const dropdown = li.querySelector(':scope > ul');
  if (!dropdown) return;

  const megaMenu = document.createElement('div');
  megaMenu.classList.add('mega-menu');

  // Detect layout type
  const dropdownItems = [...dropdown.querySelectorAll(':scope > li')];
  const hasColumns = dropdownItems.some((colLi) => colLi.querySelector(':scope > ul'));
  const hasDeepNesting = dropdownItems.some((colLi) => {
    const innerUl = colLi.querySelector(':scope > ul');
    if (!innerUl) return false;
    return [...innerUl.querySelectorAll(':scope > li')].some(
      (innerLi) => innerLi.querySelector(':scope > ul'),
    );
  });

  let promoCard = null;

  if (hasDeepNesting) {
    // Tabbed/sidebar layout (Products)
    megaMenu.classList.add('mega-menu-tabbed-layout');

    const sidebar = document.createElement('div');
    sidebar.classList.add('mega-menu-sidebar');

    const content = document.createElement('div');
    content.classList.add('mega-menu-content');

    let tabIndex = 0;

    dropdownItems.forEach((categoryLi) => {
      const categoryHeading = categoryLi.querySelector(':scope > p');
      const categoryUl = categoryLi.querySelector(':scope > ul');

      if (!categoryUl) {
        // "View All Products" link
        const link = categoryLi.querySelector('a');
        if (link) {
          const va = document.createElement('a');
          va.href = link.href;
          va.textContent = link.textContent;
          va.classList.add('mega-menu-view-all');
          sidebar.append(va);
        }
        return;
      }

      // Sidebar section heading
      const sidebarSection = document.createElement('div');
      sidebarSection.classList.add('mega-menu-sidebar-section');

      if (categoryHeading) {
        const heading = document.createElement('h3');
        heading.classList.add('mega-menu-sidebar-heading');
        heading.textContent = categoryHeading.textContent.trim();
        sidebarSection.append(heading);
      }

      const tabsList = document.createElement('ul');
      tabsList.classList.add('mega-menu-sidebar-items');

      [...categoryUl.querySelectorAll(':scope > li')].forEach((tabLi) => {
        const tabP = tabLi.querySelector(':scope > p');
        const tabUl = tabLi.querySelector(':scope > ul');

        const tabItem = document.createElement('li');
        tabItem.classList.add('mega-menu-tab');
        tabItem.dataset.tab = tabIndex;
        tabItem.textContent = tabP?.textContent.split('|')[0].trim() || '';
        if (tabIndex === 0) tabItem.classList.add('active');

        tabItem.addEventListener('click', (e) => {
          e.stopPropagation();
          sidebar.querySelectorAll('.mega-menu-tab').forEach((t) => t.classList.remove('active'));
          content.querySelectorAll('.mega-menu-panel').forEach((pnl) => pnl.classList.remove('active'));
          tabItem.classList.add('active');
          const panel = content.querySelector(`[data-panel="${tabItem.dataset.tab}"]`);
          if (panel) panel.classList.add('active');
        });

        tabsList.append(tabItem);

        // Build content panel
        const panel = document.createElement('div');
        panel.classList.add('mega-menu-panel');
        panel.dataset.panel = tabIndex;
        if (tabIndex === 0) panel.classList.add('active');

        // Panel header from pipe-separated <p>
        if (tabP) {
          const headerParts = [];
          tabP.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent.split('|').forEach((part) => {
                const t = part.trim();
                if (t) headerParts.push(t);
              });
            }
          });
          const headerLink = tabP.querySelector('a');

          if (headerParts.length > 0 || headerLink) {
            const panelHeader = document.createElement('div');
            panelHeader.classList.add('mega-menu-panel-header');

            const headerInfoEl = document.createElement('div');
            const title = document.createElement('h3');
            title.classList.add('mega-menu-heading');
            [title.textContent] = headerParts.length ? headerParts : [tabP.textContent.split('|')[0].trim()];
            headerInfoEl.append(title);

            if (headerParts[1]) {
              const desc = document.createElement('p');
              desc.classList.add('mega-menu-header-desc');
              [, desc.textContent] = headerParts;
              headerInfoEl.append(desc);
            }
            panelHeader.append(headerInfoEl);

            if (headerLink) {
              const cta = document.createElement('a');
              cta.href = headerLink.href;
              cta.textContent = headerLink.textContent;
              cta.classList.add('mega-menu-header-cta');
              panelHeader.append(cta);
            }
            panel.append(panelHeader);
          }
        }

        // Panel body
        if (tabUl) {
          const panelBody = document.createElement('div');
          panelBody.classList.add('mega-menu-panel-body');

          const firstSubLi = tabUl.querySelector(':scope > li');
          const hasSubSections = firstSubLi?.querySelector(':scope > ul');

          if (hasSubSections) {
            // Deep structure: sub-sections with headings + items
            [...tabUl.querySelectorAll(':scope > li')].forEach((subLi) => {
              const subP = subLi.querySelector(':scope > p');
              const subUl = subLi.querySelector(':scope > ul');

              const section = document.createElement('div');
              section.classList.add('mega-menu-panel-section');

              if (subP) {
                const subHeading = document.createElement('h4');
                subHeading.classList.add('mega-menu-panel-subheading');
                subHeading.textContent = subP.textContent.split('|')[0].trim();
                section.append(subHeading);
              }

              if (subUl) {
                const items = document.createElement('ul');
                items.classList.add('mega-menu-items');
                [...subUl.querySelectorAll(':scope > li')].forEach((itemLi) => {
                  const link = itemLi.querySelector('a');
                  if (link) items.append(buildMenuItem(link));
                });
                section.append(items);
              }

              panelBody.append(section);
            });
          } else {
            // Flat list of items
            const items = document.createElement('ul');
            items.classList.add('mega-menu-items', 'mega-menu-items-grid');
            [...tabUl.querySelectorAll(':scope > li')].forEach((itemLi) => {
              const link = itemLi.querySelector('a');
              if (link) items.append(buildMenuItem(link));
              // Promo card
              [...itemLi.querySelectorAll(':scope > p')].forEach((pp) => {
                if (pp.querySelector('picture')) promoCard = buildPromoCard(pp);
              });
            });
            panelBody.append(items);
          }

          panel.append(panelBody);
        }

        content.append(panel);
        tabIndex += 1;
      });

      sidebarSection.append(tabsList);
      sidebar.append(sidebarSection);
    });

    megaMenu.append(sidebar);
    megaMenu.append(content);
  } else if (hasColumns) {
    // Column layout (Company, Services, Resources, Platform)
    megaMenu.classList.add('mega-menu-columns-layout');

    // Header bar (e.g. Platform: logo + description + CTA)
    if (headerInfo && (headerInfo.title || headerInfo.picture)) {
      const header = document.createElement('div');
      header.classList.add('mega-menu-header');

      if (headerInfo.picture) {
        const picWrap = document.createElement('div');
        picWrap.classList.add('mega-menu-header-logo');
        picWrap.append(headerInfo.picture);
        header.append(picWrap);
      }

      const headerText = document.createElement('div');
      headerText.classList.add('mega-menu-header-text');
      if (headerInfo.title) {
        const desc = document.createElement('p');
        desc.classList.add('mega-menu-header-desc');
        desc.textContent = headerInfo.title;
        headerText.append(desc);
      }
      header.append(headerText);

      if (headerInfo.ctaLink) {
        const cta = document.createElement('a');
        cta.href = headerInfo.ctaLink.href;
        cta.textContent = headerInfo.ctaLink.textContent;
        cta.classList.add('mega-menu-header-cta');
        header.append(cta);
      }

      megaMenu.append(header);
    }

    const columnsContainer = document.createElement('div');
    columnsContainer.classList.add('mega-menu-columns');

    dropdownItems.forEach((colLi) => {
      const column = document.createElement('div');
      column.classList.add('mega-menu-column');

      const headingP = colLi.querySelector(':scope > p');
      if (headingP) {
        const heading = document.createElement('h3');
        heading.classList.add('mega-menu-heading');
        heading.textContent = headingP.textContent.trim();
        column.append(heading);
      }

      const itemsList = colLi.querySelector(':scope > ul');
      if (itemsList) {
        const itemsUl = document.createElement('ul');
        itemsUl.classList.add('mega-menu-items');

        [...itemsList.querySelectorAll(':scope > li')].forEach((itemLi) => {
          const link = itemLi.querySelector('a');
          if (link) itemsUl.append(buildMenuItem(link));

          // Promo card as 2nd <p> on an item
          [...itemLi.querySelectorAll(':scope > p')].forEach((ip) => {
            if (ip.querySelector('picture')) promoCard = buildPromoCard(ip);
          });
        });

        column.append(itemsUl);
      }

      // Promo card as sibling <p> to <ul>
      [...colLi.querySelectorAll(':scope > p')].forEach((cp) => {
        if (cp !== headingP && cp.querySelector('picture')) {
          promoCard = buildPromoCard(cp);
        }
      });

      columnsContainer.append(column);
    });

    megaMenu.append(columnsContainer);
  } else {
    // Grid layout (Industries)
    megaMenu.classList.add('mega-menu-grid-layout');

    // Header bar
    if (headerInfo && (headerInfo.title || headerInfo.description)) {
      const header = document.createElement('div');
      header.classList.add('mega-menu-header');

      const headerText = document.createElement('div');
      headerText.classList.add('mega-menu-header-text');
      if (headerInfo.title) {
        const title = document.createElement('h3');
        title.classList.add('mega-menu-heading');
        title.textContent = headerInfo.title;
        headerText.append(title);
      }
      if (headerInfo.description) {
        const desc = document.createElement('p');
        desc.classList.add('mega-menu-header-desc');
        desc.textContent = headerInfo.description;
        headerText.append(desc);
      }
      header.append(headerText);

      if (headerInfo.ctaLink) {
        const cta = document.createElement('a');
        cta.href = headerInfo.ctaLink.href;
        cta.textContent = headerInfo.ctaLink.textContent;
        cta.classList.add('mega-menu-header-cta');
        header.append(cta);
      }

      megaMenu.append(header);
    }

    // Grid of items
    const gridContainer = document.createElement('div');
    gridContainer.classList.add('mega-menu-grid-body');

    const gridUl = document.createElement('ul');
    gridUl.classList.add('mega-menu-grid');
    let viewAllLink = null;

    dropdownItems.forEach((itemLi) => {
      const firstP = itemLi.querySelector(':scope > p');
      const firstLink = firstP?.querySelector('a');

      // Check for promo card (picture in same <p> after <br>, or in separate <p>)
      if (firstP?.querySelector('picture')) {
        promoCard = buildPromoCard(firstP);
      }
      [...itemLi.querySelectorAll(':scope > p')].forEach((pp) => {
        if (pp !== firstP && pp.querySelector('picture')) {
          promoCard = buildPromoCard(pp);
        }
      });

      // Check for "View all" link (2nd <p> without picture)
      const allPs = [...itemLi.querySelectorAll(':scope > p')];
      allPs.forEach((pp) => {
        if (pp !== firstP && !pp.querySelector('picture')) {
          const vLink = pp.querySelector('a');
          if (vLink) viewAllLink = vLink;
        }
      });

      // Build the item if it has a real link
      if (firstLink) {
        const linkText = firstLink.textContent.split('|')[0].trim();
        if (linkText.toLowerCase().includes('view all')) {
          viewAllLink = firstLink;
        } else {
          gridUl.append(buildMenuItem(firstLink));
          // If this <p> also has a picture (after <br>), extract promo from it
          if (firstP?.querySelector('picture')) {
            promoCard = buildPromoCard(firstP);
          }
        }
      }
    });

    gridContainer.append(gridUl);

    if (viewAllLink) {
      const viewAll = document.createElement('a');
      viewAll.href = viewAllLink.href;
      viewAll.textContent = viewAllLink.textContent;
      viewAll.classList.add('mega-menu-view-all');
      gridContainer.append(viewAll);
    }

    megaMenu.append(gridContainer);
  }

  if (promoCard) megaMenu.append(promoCard);
  dropdown.replaceWith(megaMenu);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, 'false');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // children[0] = utility bar (Login, Status, etc.)
  // children[1] = logo + main nav items (split into brand + sections)
  const utilitySection = nav.children[0];
  const contentSection = nav.children[1];

  if (utilitySection) {
    utilitySection.classList.add('nav-utility');

    // Language dropdown: the <li> containing the globe icon has the language sub-list
    const langItem = utilitySection.querySelector('.icon-globe')?.closest('li');
    const langDropdown = langItem?.querySelector('ul');
    if (langItem && langDropdown) {
      langItem.classList.add('nav-utility-lang');
      langDropdown.classList.add('nav-lang-dropdown');

      // Hide dropdown immediately via inline style (CSS may not be parsed yet)
      langDropdown.style.display = 'none';

      // Clean pipe-prefixed text (e.g. "EN|" before the link)
      langDropdown.querySelectorAll('li').forEach((item) => {
        item.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent.replace(/^[A-Z]{2}\|/, '');
          }
        });
      });

      const trigger = langItem.querySelector('p');
      if (trigger) {
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = langDropdown.style.display !== 'none';
          langDropdown.style.display = isOpen ? 'none' : 'block';
          trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        });
        trigger.addEventListener('keydown', (e) => {
          if (e.code === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            trigger.click();
          }
        });
      }

      // Close on outside click
      document.addEventListener('click', () => {
        langDropdown.style.display = 'none';
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  }

  if (contentSection) {
    const contentWrapper = contentSection.querySelector('.default-content-wrapper');

    // Extract logo into nav-brand
    const logoPara = contentWrapper?.querySelector('p:first-child');
    if (logoPara) {
      const navBrandSection = document.createElement('div');
      navBrandSection.classList.add('nav-brand');
      const brandWrapper = document.createElement('div');
      brandWrapper.classList.add('default-content-wrapper');
      brandWrapper.append(logoPara);
      navBrandSection.append(brandWrapper);
      nav.insertBefore(navBrandSection, contentSection);
    }

    // Split list items: with sub-list → nav-sections, without → nav-tools
    const navList = contentWrapper?.querySelector('ul');
    if (navList) {
      const allItems = [...navList.querySelectorAll(':scope > li')];
      const sectionItems = allItems.filter((li) => li.querySelector(':scope > ul'));
      const toolItems = allItems.filter((li) => !li.querySelector(':scope > ul'));

      // Clean each section item: extract header info, clean label, build mega menu
      sectionItems.forEach((li) => {
        const p = li.querySelector(':scope > p');
        let headerInfo = null;

        if (p) {
          // Extract header info from pipe-separated label (e.g. Industries)
          const allLinks = [...p.querySelectorAll('a')];
          const textParts = [];
          p.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent.split('|').forEach((part) => {
                const trimmed = part.trim();
                if (trimmed) textParts.push(trimmed);
              });
            }
          });

          if (textParts.length > 0 || allLinks.length > 1) {
            headerInfo = {
              title: textParts[0] || '',
              description: textParts[1] || '',
              ctaLink: allLinks.length > 1 ? allLinks[allLinks.length - 1] : null,
              picture: p.querySelector('picture')?.cloneNode(true) || null,
            };
          }

          // Clean the label to just the primary link/text
          const firstLink = p.querySelector('a');
          if (firstLink) {
            const cleanLink = document.createElement('a');
            cleanLink.href = firstLink.href;
            [cleanLink.textContent] = firstLink.textContent.trim().split('|');
            p.replaceChildren(cleanLink);
          } else {
            p.textContent = p.textContent.split('|')[0].trim();
          }
        }

        decorateMegaMenu(li, headerInfo);
      });

      navList.replaceChildren(...sectionItems);
      contentSection.classList.add('nav-sections');

      // Build nav-tools from remaining items
      if (toolItems.length) {
        toolItems.forEach((li) => {
          if (li.querySelector('.icon-nice-search-icon, .icon-search')) li.classList.add('nav-tool-search');
          const a = li.querySelector('a');
          if (a?.textContent.trim() === 'Watch Demo') li.classList.add('nav-tool-demo');
          if (a?.textContent.trim() === 'Get Started') li.classList.add('nav-tool-cta');
        });
        const toolsList = document.createElement('ul');
        toolsList.append(...toolItems);
        const toolsWrapper = document.createElement('div');
        toolsWrapper.classList.add('default-content-wrapper');
        toolsWrapper.append(toolsList);
        const navToolsSection = document.createElement('div');
        navToolsSection.classList.add('nav-tools');
        navToolsSection.append(toolsWrapper);
        nav.append(navToolsSection);
      }
    } else {
      contentSection.classList.add('nav-sections');
    }
  }

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('.mega-menu')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', (e) => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        } else {
          // Mobile accordion toggle
          e.stopPropagation();
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // Utility bar lives above <nav> in the wrapper so it can span full width
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  if (utilitySection) {
    nav.removeChild(utilitySection);
    navWrapper.append(utilitySection);
  }
  navWrapper.append(nav);
  block.append(navWrapper);
}
