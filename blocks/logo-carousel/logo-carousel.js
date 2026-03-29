export default function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows[0];
  const logosRow = rows[1];

  const headingText = headingRow?.textContent.trim() || '';
  const pictures = logosRow ? [...logosRow.querySelectorAll('picture')] : [];

  // Build logo items HTML — duplicate for seamless infinite scroll
  let logosHtml = '';
  pictures.forEach((pic) => {
    const img = pic.querySelector('img');
    if (img) {
      const src = pic.querySelector('source[media*="600"]')?.srcset || img.src;
      logosHtml += `<div class="lc-logo"><img src="${src}" alt="${img.alt || ''}" loading="lazy"></div>`;
    }
  });

  // Duplicate the set for seamless loop
  const trackHtml = logosHtml + logosHtml;

  block.innerHTML = `
    <div class="lc-heading">${headingText}</div>
    <div class="lc-track-wrapper">
      <div class="lc-track">${trackHtml}</div>
    </div>
  `;
}
