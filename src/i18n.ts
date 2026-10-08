// Language for this page load, taken from the URL: Hindi pages live under /hi (/hi/, /hi/vyuh, …), English at the
// root. Pages are plain links, so the language is fixed until the next navigation.
import { COPY, type Lang } from './data/site';
import { PRODUCTS } from './data/products';
import { PRODUCTS_HI } from './data/products.hi';

export const LANG: Lang = /^\/hi(\/|$)/.test(location.pathname) ? 'hi' : 'en';
/** This page's copy. */
export const S = COPY[LANG];
export const PRODUCTS_L = LANG === 'hi' ? PRODUCTS_HI : PRODUCTS;

/** The current path without the language prefix ('/hi/vyuh' → '/vyuh', '/hi/' → '/'). */
export const basePath = () => location.pathname.replace(/^\/hi(?=\/|$)/, '') || '/';
const prefix = (lang: Lang, href: string) => (lang === 'hi' && href.startsWith('/') ? `/hi${href}` : href);
/** A site link that stays in this page's language ('/vyuh' → '/hi/vyuh', '/#team' → '/hi/#team'). */
export const link = (href: string) => prefix(LANG, href);
/** This page in the other language, keeping the section in view. */
export const otherLangHref = () => prefix(LANG === 'hi' ? 'en' : 'hi', basePath()) + location.hash;
