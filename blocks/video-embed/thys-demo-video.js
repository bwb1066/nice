const VIDEO_URL = 'https://resources.nice.com/wp-content/uploads/2026/02/NiCE_WORLD_3770x1500_with-dates-V1.mp4';

/**
 * loads and decorates the thys-demo-video block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'metadata');

  const source = document.createElement('source');
  source.src = VIDEO_URL;
  source.type = 'video/mp4';

  video.append(source);
  block.replaceChildren(video);
}
