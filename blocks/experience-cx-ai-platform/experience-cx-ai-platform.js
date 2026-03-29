export default function decorate(block) {
  const row = block.children[0];
  const col = row?.children[0];
  if (!col) return;

  const picture = col.querySelector('picture');
  const heading = col.querySelector('h1');
  const links = col.querySelectorAll('a');

  const ctaContainer = document.createElement('div');
  ctaContainer.className = 'ecap-ctas';

  [...links].forEach((link, i) => {
    const btn = document.createElement('a');
    btn.href = link.href;
    btn.textContent = link.textContent;
    btn.className = i === 0 ? 'ecap-btn ecap-btn-primary' : 'ecap-btn ecap-btn-secondary';
    if (i === 0) {
      const playIcon = document.createElement('span');
      playIcon.className = 'ecap-play-icon';
      playIcon.innerHTML = '&#9654;';
      btn.prepend(playIcon);
    }
    ctaContainer.appendChild(btn);
  });

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'ecap-image';
  if (picture) imageWrapper.appendChild(picture);

  block.innerHTML = '';

  const content = document.createElement('div');
  content.className = 'ecap-content';
  if (heading) {
    heading.className = 'ecap-heading';
    content.appendChild(heading);
  }
  content.appendChild(ctaContainer);

  block.appendChild(content);
  block.appendChild(imageWrapper);
}
