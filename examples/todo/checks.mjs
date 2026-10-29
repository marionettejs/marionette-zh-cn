import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { once } from 'node:events';
import { chromium } from 'playwright';

const root = new URL('.', import.meta.url);
const result = { startedAt: new Date().toISOString(), node: process.version, checks: [], errors: [] };
const log = createWriteStream(new URL('evidence/preview.log', root));
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
server.stdout.pipe(log);
server.stderr.pipe(log);
let browser;
let page;
async function check(name, work) {
  try {
    await work();
    result.checks.push({ name, status: 'PASS' });
    console.log(`PASS ${name}`);
  } catch (error) {
    result.checks.push({ name, status: 'FAIL', message: error.message });
    throw error;
  }
}
try {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:4173', { signal: AbortSignal.timeout(500) });
      if (response.ok) break;
    } catch { /* Wait for this run's local preview only. */ }
    if (server.exitCode !== null || attempt >= 50) throw new Error('Preview did not become ready');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  result.browser = await browser.version();
  result.playwright = JSON.parse(await readFile(new URL('node_modules/playwright/package.json', root))).version;
  page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(5000);
  await page.route('**/*', route => {
    if (new URL(route.request().url()).origin === 'http://127.0.0.1:4173') return route.continue();
    result.errors.push(`Unexpected external request: ${route.request().url()}`);
    return route.abort();
  });
  page.on('pageerror', error => result.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') result.errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4173');
  const draft = page.locator('input[name=draft]');
  const rows = page.locator('li');
  const status = page.getByRole('status');
  const filter = key => page.locator(`button[data-filter=${key}]`);
  const summary = async (done, total, visible) => {
    assert.equal(await status.innerText(), `已完成 ${done} / 共 ${total} 项`);
    assert.equal(await rows.count(), visible);
  };
  const draftIs = async text => {
    assert.equal(await draft.inputValue(), text);
    assert.equal(await draft.evaluate(node => node === window.fixtureDraftNode), true);
  };
  await check('Empty initial state: 0 / 0 and zero rows', () => summary(0, 0, 0));
  await check('Ordinary browser Enter adds each of three synthetic tasks exactly once', async () => {
    for (const [index, title] of ['Task Alpha', 'Task Beta', 'Task Gamma'].entries()) {
      await draft.fill(title);
      await draft.press('Enter');
      await summary(0, index + 1, index + 1);
      assert.equal(await draft.inputValue(), '');
    }
    assert.deepEqual(await rows.locator('span').allTextContents(), ['Task Alpha', 'Task Beta', 'Task Gamma']);
  });
  await check('Complete one task: 1 / 3', async () => {
    await rows.nth(0).getByRole('checkbox').check();
    await summary(1, 3, 3);
  });
  await draft.fill('Unsent synthetic draft 草稿');
  await draft.evaluate(node => { window.fixtureDraftNode = node; });
  await check('All, active, completed filters retain global 1 / 3 counts and the same draft node/value', async () => {
    for (const [key, visible] of [['active', 2], ['completed', 1], ['all', 3]]) {
      await filter(key).click();
      await summary(1, 3, visible);
      await draftIs('Unsent synthetic draft 草稿');
      assert.equal(await filter(key).getAttribute('aria-pressed'), 'true');
    }
  });
  await check('Twelve completion/reversal cycles retain counts and unsent draft', async () => {
    for (let cycle = 0; cycle < 12; cycle++) {
      const checkbox = rows.nth(1).getByRole('checkbox');
      await checkbox.check();
      await summary(2, 3, 3);
      await draftIs('Unsent synthetic draft 草稿');
      await checkbox.uncheck();
      await summary(1, 3, 3);
      await draftIs('Unsent synthetic draft 草稿');
    }
  });
  await check('Reversal/completion removes filtered rows, keeps draft, and focuses filter', async () => {
    await filter('completed').click();
    // The click removes this row. Assert the resulting presentation directly;
    // uncheck() waits for a post-click checked state on an already removed node.
    await rows.nth(0).getByRole('checkbox').click();
    await summary(0, 3, 0);
    assert.equal(await filter('completed').evaluate(node => node === document.activeElement), true);
    await draftIs('Unsent synthetic draft 草稿');
    await filter('active').click();
    await rows.nth(0).getByRole('checkbox').click();
    await summary(1, 3, 2);
    assert.equal(await filter('active').evaluate(node => node === document.activeElement), true);
    await draftIs('Unsent synthetic draft 草稿');
  });
  await check('Adding with completed filter selected updates total without showing active task', async () => {
    await filter('completed').click();
    await draft.press('Enter');
    await summary(1, 4, 1);
    assert.equal(await draft.inputValue(), '');
    await filter('all').click();
    assert.equal(await rows.filter({ hasText: 'Unsent synthetic draft 草稿' }).count(), 1);
  });
  await check('Empty and whitespace Enter submissions do not create tasks', async () => {
    await draft.press('Enter');
    await summary(1, 4, 4);
    await draft.fill('   ');
    await draft.press('Enter');
    await summary(1, 4, 4);
    assert.equal(await draft.inputValue(), '   ');
  });
  await check('Synthetic composition guards block Enter and form submission; post-composition ordinary Enter adds once', async () => {
    await draft.fill('Synthetic composition text');
    await draft.dispatchEvent('compositionstart', { data: '' });
    await draft.press('Enter');
    await page.locator('form').dispatchEvent('submit');
    await summary(1, 4, 4);
    assert.equal(await draft.inputValue(), 'Synthetic composition text');
    await filter('active').click();
    await draftIs('Synthetic composition text');
    await draft.dispatchEvent('compositionend', { data: 'Synthetic composition text' });
    for (const flags of [{ isComposing: true }, { keyCode: 229 }]) {
      const blocked = await draft.evaluate((node, init) => {
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init });
        node.dispatchEvent(event);
        return event.defaultPrevented;
      }, flags);
      assert.equal(blocked, true);
    }
    await draft.press('Enter');
    await summary(1, 5, 4);
    assert.equal(await rows.filter({ hasText: 'Synthetic composition text' }).count(), 1);
    assert.equal(await draft.inputValue(), '');
  });
  await check('Synthetic markup is rendered as literal task text', async () => {
    await draft.fill('<img src=x onerror="throw new Error(123)">');
    await page.locator('button[type=submit]').click();
    await summary(1, 6, 5);
    assert.equal(await rows.locator('img').count(), 0);
    assert.equal(await rows.last().locator('span').innerText(), '<img src=x onerror="throw new Error(123)">');
  });
  await check('Narrow 375px viewport has no horizontal document overflow', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  });
  await check('No browser JavaScript/console errors or external network requests', async () => {
    assert.deepEqual(result.errors, []);
  });
  result.status = 'PASS';
} catch (error) {
  result.status = 'FAIL';
  result.failure = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  if (page) await writeFile(new URL('evidence/final-dom.html', root), await page.content()).catch(() => {});
  if (browser) await browser.close();
  if (server.exitCode === null) {
    const stopped = once(server, 'exit');
    server.kill('SIGTERM');
    await stopped;
  }
  log.end();
  await writeFile(new URL('evidence/browser-results.json', root), JSON.stringify(result, null, 2) + '\n');
}
