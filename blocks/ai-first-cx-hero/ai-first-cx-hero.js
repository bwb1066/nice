const INTERVAL = 10000;

export default function decorate(block) {
  const rows = [...block.children];

  // Extract accordion items from rows
  const items = rows.map((row) => {
    const cols = [...row.children];
    const textCol = cols[0];
    const imgCol = cols[2] || cols[1]; // large image is col 3

    const heading = textCol?.querySelector('h3')?.textContent.trim() || '';
    const desc = [...(textCol?.querySelectorAll('p') || [])].filter((p) => !p.querySelector('a')).map((p) => p.textContent.trim()).join(' ');
    const ctaEl = textCol?.querySelector('a');
    const cta = ctaEl ? { text: ctaEl.textContent, href: ctaEl.href } : null;

    // Icons from col 2 (expand/collapse)
    const iconsCol = cols[1];
    const iconPics = iconsCol ? [...iconsCol.querySelectorAll('picture')] : [];
    const expandIcon = iconPics[0]?.querySelector('img')?.src || '';
    const collapseIcon = iconPics[1]?.querySelector('img')?.src || '';

    // Get feature image from col 3
    let imgSrc = '';
    const featureCol = cols[2];
    const pic = featureCol?.querySelector('picture');
    if (pic) {
      const src = pic.querySelector('source[media*="600"]');
      const img = pic.querySelector('img');
      imgSrc = src?.srcset || img?.src || '';
    }

    return { heading, desc, cta, imgSrc, expandIcon, collapseIcon };
  });

  // Build HTML
  let accordionHtml = '';
  let imagesHtml = '';

  items.forEach((item, i) => {
    const active = i === 0 ? ' afc-active' : '';
    const ctaHtml = item.cta ? `<a href="${item.cta.href}" class="afc-cta">${item.cta.text}<span class="afc-arrow">→</span></a>` : '';

    accordionHtml += `
      <div class="afc-item${active}" data-idx="${i}">
        <div class="afc-item-header">
          <span class="afc-title">${item.heading}</span>
          <span class="afc-icon">
            <img class="afc-icon-expand" src="${item.expandIcon}" alt="">
            <img class="afc-icon-collapse" src="${item.collapseIcon}" alt="">
          </span>
        </div>
        <div class="afc-item-body">
          <p class="afc-desc">${item.desc}</p>
          ${ctaHtml}
        </div>
      </div>
    `;

    imagesHtml += `<div class="afc-img${active}" data-idx="${i}"><img src="${item.imgSrc}" alt="" loading="lazy"></div>`;
  });

  block.innerHTML = `
    <div class="afc-layout">
      <div class="afc-accordion">${accordionHtml}</div>
      <div class="afc-images">${imagesHtml}</div>
    </div>
  `;

  // Logic
  let current = 0;
  let timer;
  const allItems = block.querySelectorAll('.afc-item');
  const allImgs = block.querySelectorAll('.afc-img');

  function show(idx) {
    current = idx;
    allItems.forEach((el, i) => el.classList.toggle('afc-active', i === idx));
    allImgs.forEach((el, i) => el.classList.toggle('afc-active', i === idx));
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => show((current + 1) % items.length), INTERVAL);
  }

  allItems.forEach((el) => {
    el.querySelector('.afc-item-header').addEventListener('click', () => {
      show(Number(el.dataset.idx));
    });
  });

  resetTimer();
}
