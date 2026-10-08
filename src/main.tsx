import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { dishUrl, satUrl } from './scene/assets';
import { LANG } from './i18n';
import './styles/global.css';

document.documentElement.lang = LANG;
if (LANG === 'hi') {
  const f = document.createElement('link');
  Object.assign(f, { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap' });
  document.head.appendChild(f);
}

// Start downloading the 3D scene code and models in parallel with the first render instead of after it.
// (Product pages use the same models in their turntables.)
if (/^\/(hi\/?)?$/.test(location.pathname)) void import('./scene/gsScene.js');
for (const href of [dishUrl, satUrl]) {
  const l = document.createElement('link');
  Object.assign(l, { rel: 'preload', as: 'fetch', href, crossOrigin: 'anonymous' });
  document.head.appendChild(l);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
