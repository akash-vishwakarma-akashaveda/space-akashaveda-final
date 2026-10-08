import { useCallback, useEffect, useState } from 'react';
import { Journey } from './components/Journey';
import { Lower } from './components/Lower';
import { Nav } from './components/Nav';
import { Product } from './components/Product';
import { productAt } from './data/products';
import { useSpotlight } from './hooks/useReveal';
import { PRODUCTS_L, basePath } from './i18n';

// Plain links between pages: each product has its own URL, in English and under /hi.
const product = productAt(basePath(), PRODUCTS_L);

export function App() {
  const [chapter, setChapter] = useState(0);
  const onChapter = useCallback((ci: number) => setChapter(ci), []);
  useSpotlight();

  // Links like /#team arrive before React has drawn the sections, so the browser can't jump; do it once they exist.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  if (product)
    return (
      <>
        <div className="scroll-progress" aria-hidden="true" />
        <Nav />
        <Product page={product} />
      </>
    );
  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <Nav activeChapter={chapter} />
      <main>
        <Journey onChapter={onChapter} />
        <Lower />
      </main>
    </>
  );
}
