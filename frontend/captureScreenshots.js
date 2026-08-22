import { chromium } from '@playwright/test';
import path from 'path';

async function main() {
  console.log('Launching browser to capture visual verification artifacts...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const artifactDir = 'C:\\Users\\arnab\\.gemini\\antigravity\\brain\\abeb79e5-9c9b-4a2e-a458-e9a5ce6eb62f';

  // 1. Capture Dashboard & Skill Tree SVG Graph
  await page.goto('http://localhost:5173');
  await page.waitForSelector('h1');
  await page.waitForTimeout(1500);
  const path1 = path.join(artifactDir, 'alis_dashboard_skill_tree.png');
  await page.screenshot({ path: path1, fullPage: true });
  console.log(`Saved screenshot 1: ${path1}`);

  // 2. Capture Accessible Tree Mode
  await page.click('button:has-text("Accessible Tree View")');
  await page.waitForTimeout(1000);
  const path2 = path.join(artifactDir, 'alis_accessible_tree_mode.png');
  await page.screenshot({ path: path2, fullPage: true });
  console.log(`Saved screenshot 2: ${path2}`);

  // Switch back to graph view & attempt quiz
  await page.click('button:has-text("Visual Graph View")');
  await page.waitForTimeout(1500);

  // Wait for radio input and submit
  const radio = await page.$('input[type="radio"]');
  if (radio) {
    await radio.click();
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }

  // 3. Capture Routing Decision Result
  const path3 = path.join(artifactDir, 'alis_telemetry_quiz_flow.png');
  await page.screenshot({ path: path3, fullPage: true });
  console.log(`Saved screenshot 3: ${path3}`);

  await browser.close();
  console.log('Visual verification complete!');
}

main().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
