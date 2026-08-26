/**
 * Captures era screenshots for the README from the production build.
 *
 * Drives the real app in headless Chromium (SwiftShader software WebGL):
 * serves `dist/` via `vite preview`, waits past the loading overlay, clicks
 * each timeline stop, lets the morph + rig settles finish, then saves a
 * 1920x1080 PNG per era into docs/screenshots/.
 *
 * Readiness is polled THROUGH the browser (Chromium reaches the loopback
 * server fine; Node's own undici fetch may be restricted in sandboxes).
 *
 * Usage: node scripts/capture-screenshots.mjs   (run `npm run build` first)
 * Environment:
 *   CHROMIUM_PATH  override the chromium binary (default /usr/bin/chromium)
 *   CAP_PORT       override the preview port (default 4520)
 */
import { spawn } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const YEARS = [1945, 1965, 1985, 2005, 2025, 2055];
const PORT = Number(process.env.CAP_PORT ?? 4520);
const HOST = '127.0.0.1';
const URL = `http://${HOST}:${PORT}/`;
const OUT_DIR = 'docs/screenshots';
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hard watchdog so a hung renderer can never wedge CI/sessions again.
setTimeout(() => {
  console.error('capture watchdog fired — exiting');
  process.exit(2);
}, 8 * 60_000).unref();

mkdirSync(OUT_DIR, { recursive: true });

// Serve the production build on an exclusive IPv4 loopback port.
const server = spawn(
  'npx',
  [
    'vite',
    'preview',
    '--host', HOST,
    '--port', String(PORT),
    '--strictPort',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
server.on('error', (error) => console.error('preview spawn error:', error.message));

let browser;
let exitCode = 0;
try {
  browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--window-size=1920,1080',
    ],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);
  // Skip the cinematic intro deterministically; navigation hands straight to
  // orbit mode and the default view is the framing we want to showcase.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  page.on('pageerror', (error) => console.error('pageerror:', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('console:', message.text());
  });

  // Poll readiness through the browser until vite answers.
  const deadline = Date.now() + 45_000;
  let up = false;
  let lastError = '';
  while (!up && Date.now() < deadline) {
    try {
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5_000 });
      up = true;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await sleep(400);
    }
  }
  if (!up) throw new Error(`preview unreachable at ${URL}: ${lastError}`);

  // Full load (assets + module graph) once the server answers.
  await page.goto(URL, { waitUntil: 'networkidle0' });
  // Loading overlay paints → builds all eight groups → fades out.
  await page.waitForSelector('.boot-overlay', { hidden: true });
  await sleep(2_500); // A few rendered frames before the first shot.

  /** Clicks a timeline chip via DOM dispatch (CDP-click fallback). */
  const selectEra = async (year) => {
    try {
      await page.click(`.tl-chip[data-year="${year}"]`, { timeout: 10_000 });
    } catch {
      await page.evaluate((target) => {
        const chip = document.querySelector(`.tl-chip[data-year="${target}"]`);
        if (chip instanceof HTMLElement) chip.click();
      }, year);
    }
  };

  for (const year of YEARS) {
    await selectEra(year);
    // Morph (~1.2s) plus furniture fade / tableware pop-in settles. Software
    // rendering runs at low fps, so wait generously on wall-clock time.
    await sleep(year === YEARS[0] ? 4_000 : 6_000);
    const path = `${OUT_DIR}/era-${year}.png`;
    await page.screenshot({ path });
    console.log(`captured ${path} (${Math.round(statSync(path).size / 1024)} KiB)`);
  }

  console.log('done.');
} catch (error) {
  exitCode = 1;
  console.error('capture failed:', error instanceof Error ? error.message : error);
} finally {
  try {
    if (browser) await browser.close();
  } catch {
    /* already gone */
  }
  server.kill('SIGKILL');
}
process.exit(exitCode);
