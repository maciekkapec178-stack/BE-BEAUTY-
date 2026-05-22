import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const consoleErrors = [];
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    }
  });

  const urls = [
    'http://[::1]:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5173'
  ];
  let connected = false;
  for (const url of urls) {
    try {
      console.log(`Trying URL ${url}...`);
      await page.goto(url, { timeout: 3000 });
      connected = true;
      console.log(`Connected to URL ${url}`);
      break;
    } catch (e) {
      console.log(`Failed to connect to ${url}:`, e.message);
    }
  }

  if (!connected) {
    console.log("Could not connect to any local port");
    await browser.close();
    return;
  }

  // Monitor loading status and take periodic snapshots
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(1000);
    const progress = await page.evaluate(() => {
      const pct = document.querySelector('.preloader__status-pct span');
      const container = document.querySelector('.preloader-container');
      const appContainer = document.querySelector('.app-container');
      return {
        pct: pct ? pct.textContent : 'none',
        containerVisible: container ? window.getComputedStyle(container).visibility : 'none',
        appOpacity: appContainer ? window.getComputedStyle(appContainer).opacity : 'none',
      };
    });
    console.log(`After ${i}s:`, progress);
    await page.screenshot({ path: `./screenshot-dev-${i}s.png` });
  }

  console.log("Console Errors found:", consoleErrors);
  await browser.close();
}

run().catch(console.error);
