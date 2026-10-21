import {initReference,applyReferenceScale} from './community-fidelity.js';
// Presentation only. The atlas and vignette were generated with ChatGPT Image
// from the user's approved Qinghe mockups; no scores or identity matching here.
const artBase = new URL('./community-assets/generated/', import.meta.url);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const titleViews = Object.freeze({
  '认知康复看板': [100,45,825,192],
  '居民档案': [100,250,615,194],
  '认知水平评估': [100,461,857,185],
  '认知水平测评记录': [100,667,1080,182],
  '模型与处理明细': [100,864,935,189],
  '导入数据': [100,1066,600,182]
});
export function titleArtMarkup(title) {
  const box = titleViews[title];
  if (!box) return escape(title);
  return `<span class="qh-title-text">${escape(title)}</span><svg class="qh-title-image" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}" aria-hidden="true" focusable="false"><image href="${escape(new URL('page-titles.png',artBase).href)}" width="1254" height="1254"/></svg>`;
}
export function setPageTitle(view, title) {
  document.body.dataset.qhView = view;
  applyReferenceScale(view);
  const el = document.getElementById('page-title');
  if (!el) return;
  el.classList.remove('qh-art-title');
  el.textContent=title;
}
export function residentPortrait(synthetic, initial, className = '') {
  if (synthetic !== true) return `<span class="${escape(className)} qh-initial" aria-hidden="true">${escape(initial)}</span>`;
  return `<span class="${escape(className)} qh-portrait" role="img" aria-label="居民头像"><img src="${escape(new URL('../exact/portrait-residents.png',artBase).href)}" width="1254" height="1254" alt="" decoding="async"></span>`;
}
const navPaths = {
  dashboard:'<path d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9"/>',
  residents:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3Z"/>',
  cognition:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',
  assessments:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 4V2h6v2m-7 9 3 3 5-7"/>',
  models:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 12h8M8 17h5"/>'
};
export function initArt() {
  initReference();
  for (const link of []) {
    const target = link.querySelector('span'), path = navPaths[link.dataset.view];
    if (target && path) target.innerHTML = `<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }
}
