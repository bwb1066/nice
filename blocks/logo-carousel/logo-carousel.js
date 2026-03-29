export default function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows[0];
  const logosRow = rows[1];

  const headingText = headingRow?.textContent.trim() || '';
  const pictures = logosRow ? [...logosRow.querySelectorAll('picture')] : [];

  block.innerHTML = `
    <div class="lc-heading">${headingText}</div>
    <div class="lc-track-wrapper">
      <div class="lc-track"></div>
    </div>
  `;

  const track = block.querySelector('.lc-track');

  // Add original pictures + cloned set for seamless loop
  pictures.forEach((pic) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'lc-logo';
    wrapper.appendChild(pic);
    track.appendChild(wrapper);
  });
  pictures.forEach((pic) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'lc-logo';
    wrapper.appendChild(pic.cloneNode(true));
    track.appendChild(wrapper);
  });
}
