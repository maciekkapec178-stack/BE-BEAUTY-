import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const [w, h, tag] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.locator('#kontakt').screenshot({ path: `footer-visual-${tag}.png` });
  await page.close();
}
await browser.close();
