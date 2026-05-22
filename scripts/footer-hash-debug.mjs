import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5174/#kontakt', { waitUntil: 'domcontentloaded' });
for (const sec of [3, 6, 10, 15]) {
  await page.waitForTimeout(sec * 1000 - (sec === 3 ? 0 : 3000));
  const data = await page.evaluate((s) => ({
    sec: s,
    scrollY: window.scrollY,
    lenis: window.__beBeautyLenis?.scroll,
    appOpacity: getComputedStyle(document.querySelector('.app-container')).opacity,
    reveals: [...document.querySelectorAll('[data-footer-reveal]')].map((el, i) => ({
      i,
      opacity: getComputedStyle(el).opacity,
    })),
    footerTop: document.querySelector('#kontakt')?.getBoundingClientRect().top,
  }), sec);
  console.log(JSON.stringify(data));
}
await page.screenshot({ path: 'footer-hash-mobile.png' });
await browser.close();
