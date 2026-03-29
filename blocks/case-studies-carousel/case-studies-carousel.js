export default function decorate(block) {
  const rows = [...block.children];

  // Group every 3 rows into a case study
  const studies = [];
  for (let i = 0; i < rows.length; i += 3) {
    const heroRow = rows[i];
    const statsRow = rows[i + 1];
    const descsRow = rows[i + 2];
    if (!heroRow) break;

    const [bgCol, headingCol] = [...heroRow.children];
    const bgPic = bgCol?.querySelector('picture');
    const bgImg = bgPic?.querySelector('img');
    const bgSrc = bgPic?.querySelector('source[media*="600"]')?.srcset || bgImg?.src || '';

    const h2 = headingCol?.querySelector('h2');
    let logoPic = h2?.querySelector('picture');
    if (!logoPic?.querySelector('img')) logoPic = headingCol?.querySelector('picture');
    const logoImg = logoPic?.querySelector('img');
    const logoSrc = logoPic?.querySelector('source[media*="600"]')?.srcset || logoImg?.src || '';
    const title = (h2?.textContent.trim() || headingCol?.textContent.trim() || '').replace(/\s+/g, ' ');

    const statCols = statsRow ? [...statsRow.children] : [];
    const descCols = descsRow ? [...descsRow.children] : [];
    const stats = statCols.map((col, si) => ({
      value: col.textContent.trim(),
      desc: descCols[si]?.textContent.trim() || '',
    })).filter((s) => s.value);

    studies.push({ bgSrc, logoSrc, title, stats });
  }

  let slidesHtml = '';
  let logosHtml = '';

  studies.forEach((s) => {
    const statsHtml = s.stats.map((st) => `
      <div class="csc-stat">
        <div class="csc-stat-value">${st.value}</div>
        <div class="csc-stat-desc">${st.desc}</div>
      </div>
    `).join('');

    slidesHtml += `
      <div class="csc-slide">
        <div class="csc-content">
          ${s.logoSrc ? `<img class="csc-logo" src="${s.logoSrc}" alt="">` : ''}
          <h3 class="csc-title">${s.title}</h3>
          <div class="csc-stats">${statsHtml}</div>
          <div class="csc-learn">Learn more <span>→</span></div>
        </div>
        <div class="csc-bg"><img src="${s.bgSrc}" alt=""></div>
      </div>
    `;

    logosHtml += `<button class="csc-logo-btn" type="button"><img src="${s.logoSrc}" alt=""></button>`;
  });

  block.innerHTML = `
    <div class="csc-viewport">
      <div class="csc-track">${slidesHtml}</div>
    </div>
    <div class="csc-nav">
      <div class="csc-logos">${logosHtml}</div>
      <div class="csc-arrows">
        <button class="csc-prev csc-disabled" type="button" aria-label="Previous">←</button>
        <button class="csc-next" type="button" aria-label="Next">→</button>
      </div>
    </div>
  `;

  const track = block.querySelector('.csc-track');
  const allSlides = block.querySelectorAll('.csc-slide');
  const allLogos = block.querySelectorAll('.csc-logo-btn');
  const prevBtn = block.querySelector('.csc-prev');
  const nextBtn = block.querySelector('.csc-next');
  const total = studies.length;
  let current = 0;

  function show(idx) {
    current = Math.max(0, Math.min(idx, total - 1));

    // Slide width is 67%, gap is 2%. Each step = 69%.
    // First slide centered: offset = (100 - 67) / 2 = 16.5%
    // For slide N: translateX = -(N * 69) + 16.5
    const offset = 16.5 - current * 69;
    track.style.transform = `translateX(${offset}%)`;

    allSlides.forEach((s, si) => s.classList.toggle('csc-active', si === current));
    allLogos.forEach((l, li) => l.classList.toggle('csc-active', li === current));
    prevBtn.classList.toggle('csc-disabled', current === 0);
    nextBtn.classList.toggle('csc-disabled', current === total - 1);
  }

  allLogos.forEach((btn, i) => btn.addEventListener('click', () => show(i)));
  prevBtn.addEventListener('click', () => { if (current > 0) show(current - 1); });
  nextBtn.addEventListener('click', () => { if (current < total - 1) show(current + 1); });

  show(0);
}
