import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
await page.locator('#hero').screenshot({ path: 'hero-visual-mobile.png' });
const styles = await page.evaluate(() => {
  const img = document.querySelector('.hero__bg-wrapper img');
  const hero = document.querySelector('.hero');
  if (!img || !hero) return null;
  return {
    heroH: hero.offsetHeight,
    imgObjectPosition: getComputedStyle(img).objectPosition,
    imgObjectFit: getComputedStyle(img).objectFit,
    imgTransform: getComputedStyle(img).transform,
  };
});
console.log(JSON.stringify(styles, null, 2));
await browser.close();
