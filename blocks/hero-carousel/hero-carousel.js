const SLIDE_DURATION = 20000;

export default function decorate(block) {
  const rows = [...block.children];
  const controlsRow = rows.pop();
  const controlTds = [...controlsRow.querySelectorAll('tr:last-child td')];

  // Extract data before clearing
  const slides = rows.map((row) => {
    const [mediaCol, contentCol] = [...row.children];
    const picture = mediaCol?.querySelector('picture');
    const videoLink = mediaCol?.querySelector('a[href$=".mp4"]');
    let bgImgSrc = '';
    if (picture) {
      const src = picture.querySelector('source[media*="600"]');
      const img = picture.querySelector('img');
      bgImgSrc = src?.srcset || img?.src || '';
    }
    const videoSrc = videoLink?.href || '';
    const heading = contentCol?.querySelector('h1,h2,h3')?.innerHTML || '';
    let body = '';
    const ctas = [];
    contentCol?.querySelectorAll('p').forEach((p) => {
      const a = p.querySelector('a');
      if (a) ctas.push({ text: a.textContent, href: a.href });
      else if (p.textContent.trim()) body += `${p.textContent.trim()} `;
    });
    return { bgImgSrc, videoSrc, heading, body: body.trim(), ctas };
  });

  const labels = controlTds.map((td) => td.textContent.trim());

  // Inline CSS - no external file dependencies
  const css = `
    <style>
      .hcx { position:relative; width:100%; height:800px; overflow:hidden; }
      .hcx-slides { position:relative; width:100%; height:100%; }
      .hcx-s { position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; transition:opacity .6s; pointer-events:none; }
      .hcx-s.on { opacity:1; pointer-events:auto; z-index:1; }
      .hcx-s > img, .hcx-s > video { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; object-position:top; }
      .hcx-c { position:absolute; top:0; left:0; bottom:20%; width:55%; z-index:2; display:flex; flex-direction:column; justify-content:center; padding:0 5% 0 8%; box-sizing:border-box; }
      .hcx-c.hcx-centered { left:0; width:100%; align-items:center; text-align:center; padding:0 8%; }
      .hcx-c h2 { font-size:48px; font-weight:700; line-height:1.15; margin:0 0 20px; color:#fff; }
      .hcx-c .button-container { display:inline; }
      .hcx-c a.button { all:unset; cursor:pointer; }
      .hcx-c a.button::after { display:none; }
      .hcx-c p { font-size:16px; font-weight:300; line-height:1.6; margin:0 0 12px; color:rgba(255,255,255,.9); }
      .hcx-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 24px; border-radius:24px; font-size:14px; font-weight:500; text-decoration:none; margin-right:12px; margin-top:8px; }
      .hcx-dark { background:#22212b; color:#fff; border:1px solid #22212b; }
      .hcx-light { background:#fff; color:#22212b; border:1px solid #fff; }
      .hcx-ctrls { position:absolute; bottom:0; left:0; right:0; z-index:10; display:flex; justify-content:center; padding:20px 8%; }
      .hcx-cb { flex:1; max-width:280px; background:none; border:none; padding:12px 16px; cursor:pointer; text-align:center; }
      .hcx-cb span { display:block; font-size:14px; font-weight:400; color:#22212b; margin-bottom:8px; }
      .hcx-cb.on span { font-weight:600; }
      .hcx-pb { width:100%; height:3px; background:rgba(0,0,0,.15); border-radius:2px; overflow:hidden; }
      .hcx-pb > div { height:100%; width:0; background:#3694fd; border-radius:2px; }
    </style>
  `;

  // Build slides HTML
  let sh = '';
  slides.forEach((s, i) => {
    let bg = '';
    if (s.bgImgSrc) bg = `<img src="${s.bgImgSrc}" alt="">`;
    else if (s.videoSrc) bg = `<video autoplay muted loop playsinline><source src="${s.videoSrc}" type="video/mp4"></video>`;

    let btns = '';
    s.ctas.forEach((c, ci) => {
      btns += `<a href="${c.href}" class="hcx-btn ${ci === 0 ? 'hcx-dark' : 'hcx-light'}">${c.text}</a>`;
    });

    const centered = !s.heading && !s.body ? ' hcx-centered' : '';
    const content = (s.heading || s.body || btns) ? `<div class="hcx-c${centered}">
      ${s.heading ? `<h2>${s.heading}</h2>` : ''}
      ${s.body ? `<p>${s.body}</p>` : ''}
      ${btns ? `<div>${btns}</div>` : ''}
    </div>` : '';

    sh += `<div class="hcx-s${i === 0 ? ' on' : ''}" data-i="${i}">${bg}${content}</div>`;
  });

  // Build controls HTML
  let ch = '';
  labels.forEach((l, i) => {
    ch += `<button type="button" class="hcx-cb${i === 0 ? ' on' : ''}" data-i="${i}"><span>${l}</span><div class="hcx-pb"><div></div></div></button>`;
  });

  block.innerHTML = `${css}<div class="hcx"><div class="hcx-slides">${sh}</div><div class="hcx-ctrls">${ch}</div></div>`;

  // Logic
  const root = block.querySelector('.hcx');
  let cur = 0;
  let tmr;

  function go(n) {
    cur = n;
    root.querySelectorAll('.hcx-s').forEach((s, i) => { s.classList.toggle('on', i === n); });
    root.querySelectorAll('.hcx-cb').forEach((c, i) => { c.classList.toggle('on', i === n); });
    root.querySelectorAll('.hcx-s').forEach((s, i) => {
      const v = s.querySelector('video');
      if (v) { if (i === n) v.play(); else v.pause(); }
    });
    tick();
  }

  function tick() {
    clearTimeout(tmr);
    root.querySelectorAll('.hcx-pb > div').forEach((b) => { b.style.transition = 'none'; b.style.width = '0'; });
    const bar = root.querySelectorAll('.hcx-cb')[cur]?.querySelector('.hcx-pb > div');
    if (bar) requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = `width ${SLIDE_DURATION}ms linear`; bar.style.width = '100%'; }));
    tmr = setTimeout(() => go((cur + 1) % slides.length), SLIDE_DURATION);
  }

  root.querySelectorAll('.hcx-cb').forEach((b) => b.addEventListener('click', () => go(+b.dataset.i)));
  tick();
}
