export default function decorate(block) {
  const rows = [...block.children];

  // Each row = 1 card (col1: image, col2: content)
  const pictures = [];
  const cards = rows.map((row, i) => {
    const [imgCol, textCol] = [...row.children];
    const pic = imgCol?.querySelector('picture');
    pictures[i] = pic;

    const category = textCol?.querySelector('p:first-child')?.textContent.trim() || '';
    const headings = textCol?.querySelectorAll('h4') || [];
    const title = [...headings].map((h) => h.textContent.trim()).join(' ');
    const ctaLink = textCol?.querySelector('a');
    const ctaHref = ctaLink?.href || '';

    return { category, title, ctaHref };
  });

  let cardsHtml = '';
  cards.forEach((c, i) => {
    const arrow = c.ctaHref
      ? `<a href="${c.ctaHref}" class="ietc-arrow"><span>→</span></a>`
      : '<div class="ietc-arrow"><span>→</span></div>';

    cardsHtml += `
      <div class="ietc-card">
        <div class="ietc-img" data-pic="${i}"></div>
        <div class="ietc-card-body">
          ${c.category ? `<span class="ietc-cat">${c.category}</span>` : ''}
          <h4 class="ietc-title">${c.title}</h4>
          ${arrow}
        </div>
      </div>
    `;
  });

  block.innerHTML = `
    <div class="ietc-header">
      <div class="ietc-arrows">
        <button class="ietc-prev ietc-disabled" type="button" aria-label="Previous">←</button>
        <button class="ietc-next" type="button" aria-label="Next">→</button>
      </div>
    </div>
    <div class="ietc-viewport">
      <div class="ietc-track">${cardsHtml}</div>
    </div>
  `;

  // Replace placeholders with original picture elements
  block.querySelectorAll('[data-pic]').forEach((el) => {
    const pic = pictures[el.dataset.pic];
    if (pic) el.appendChild(pic);
  });

  const track = block.querySelector('.ietc-track');
  const prevBtn = block.querySelector('.ietc-prev');
  const nextBtn = block.querySelector('.ietc-next');
  const total = cards.length;
  const visibleCards = 3;
  const maxStep = Math.max(0, total - visibleCards);
  let current = 0;

  function show(idx) {
    current = Math.max(0, Math.min(idx, maxStep));
    const cardWidth = 31; // %
    const gap = 2; // %
    const shift = current * (cardWidth + gap);
    track.style.transform = `translateX(-${shift}%)`;

    prevBtn.classList.toggle('ietc-disabled', current === 0);
    prevBtn.classList.toggle('ietc-active', current > 0);
    nextBtn.classList.toggle('ietc-disabled', current >= maxStep);
  }

  prevBtn.addEventListener('click', () => { if (current > 0) show(current - 1); });
  nextBtn.addEventListener('click', () => { if (current < maxStep) show(current + 1); });

  show(0);
}
