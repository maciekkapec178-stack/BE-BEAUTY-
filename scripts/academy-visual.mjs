import { chromium } from 'playwright';

const browser = await chromium.launch();
for (const [w, h, tag] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000);
  const academy = page.locator('#academy');
  await academy.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const wrap = document.querySelector('.academy__image-wrap');
    const img = document.querySelector('.academy__image-wrap img');
    if (!wrap || !img) return { error: 'missing' };
    const wStyle = getComputedStyle(wrap);
    const iStyle = getComputedStyle(img);
    return {
      imgSrc: img.getAttribute('src'),
      imgNatural: { w: img.naturalWidth, h: img.naturalHeight, complete: img.complete },
      wrapClip: wStyle.clipPath,
      wrapRect: wrap.getBoundingClientRect(),
      imgOpacity: iStyle.opacity,
      imgTransform: iStyle.transform,
      imgObjectPosition: iStyle.objectPosition,
      imgDisplay: iStyle.display,
    };
  });
  console.log(tag, JSON.stringify(data, null, 2));
  await academy.screenshot({ path: `academy-visual-${tag}.png` });
  await page.close();
}
await browser.close();
