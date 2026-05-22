import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(10000);
await page.click('a[href="#kontakt"].desktop-only-link');
await page.waitForTimeout(2500);
const data = await page.evaluate(() => ({
  scrollY: window.scrollY,
  lenis: window.__beBeautyLenis?.scroll,
  reveals: [...document.querySelectorAll('[data-footer-reveal]')].map((el, i) => ({
    i,
    opacity: getComputedStyle(el).opacity,
  })),
  footerTop: document.querySelector('#kontakt')?.getBoundingClientRect().top,
}));
console.log(JSON.stringify(data, null, 2));
await browser.close();
