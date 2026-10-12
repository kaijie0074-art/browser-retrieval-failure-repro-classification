import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createFixtureServer } from '../fixtures/search-fixture-server.mjs';
import { classifyEvidence } from './classifier.mjs';
import { getScenarios } from './scenario-catalog.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = { scenarioId: null, trace: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--scenario') args.scenarioId = argv[++index];
    if (argv[index] === '--trace') args.trace = true;
  }
  return args;
}

function relevantHeaders(headers) {
  return {
    'content-type': headers['content-type'] || null,
    'retry-after': headers['retry-after'] || null,
    'x-search-challenge': headers['x-search-challenge'] || null,
  };
}

async function runScenario(browser, baseUrl, scenario, options) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const page = await context.newPage();
  const networkRequests = [];
  const networkResponses = [];
  const requestFailures = [];
  const consoleErrors = [];
  const pageErrors = [];
  const tracePath = path.join(projectRoot, 'evidence', 'generated', `${scenario.id}.zip`);

  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/search') {
      networkRequests.push({ method: request.method(), url: request.url() });
    }
  });
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/api/search') {
      networkResponses.push({
        status: response.status(),
        url: response.url(),
        headers: relevantHeaders(response.headers()),
      });
    }
  });
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).pathname === '/api/search') {
      requestFailures.push({ url: request.url(), errorText: request.failure()?.errorText || 'unknown' });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  if (options.trace) {
    await fs.mkdir(path.dirname(tracePath), { recursive: true });
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  }

  try {
    await page.goto(`${baseUrl}/?mode=${encodeURIComponent(scenario.mode)}&q=${encodeURIComponent(scenario.query)}`);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(scenario.mode === 'transport-timeout' ? 350 : 120);
    const pageTelemetry = await page.evaluate(() => JSON.parse(JSON.stringify(window.__retrievalTelemetry)));
    const evidence = {
      scenario: scenario.id,
      mode: scenario.mode,
      query: scenario.query,
      requestAttempted: networkRequests.length > 0 || pageTelemetry.requestAttempted,
      requestUrl: pageTelemetry.requestUrl,
      transportError: pageTelemetry.transportError,
      httpStatus: pageTelemetry.httpStatus,
      responseHeaders: pageTelemetry.responseHeaders,
      challengeMarker: pageTelemetry.challengeMarker,
      staleState: pageTelemetry.staleState,
      semanticMismatch: pageTelemetry.semanticMismatch,
      resultCount: pageTelemetry.resultCount,
      uiUpdated: pageTelemetry.uiUpdated,
      networkRequestCount: networkRequests.length,
      networkResponseCount: networkResponses.length,
      networkRequests,
      networkResponses,
      requestFailures,
      consoleErrors,
      pageErrors,
      browser: {
        name: browser.browserType().name(),
        version: browser.version(),
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
        timezoneId: 'UTC',
      },
    };
    return { ...evidence, ...classifyEvidence(evidence) };
  } finally {
    if (options.trace) await context.tracing.stop({ path: tracePath });
    await context.close();
  }
}

export async function runReproduction({ scenarioId = null, writeEvidence = true, trace = false } = {}) {
  const scenarios = getScenarios(scenarioId);
  const fixture = createFixtureServer();
  const baseUrl = await fixture.listen();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const results = [];
    for (const scenario of scenarios) {
      results.push(await runScenario(browser, baseUrl, scenario, { trace }));
    }
    const output = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      scenarioCount: results.length,
      results,
    };
    if (writeEvidence) {
      await fs.mkdir(path.join(projectRoot, 'evidence'), { recursive: true });
      await fs.writeFile(path.join(projectRoot, 'evidence', 'latest-run.json'), `${JSON.stringify(output, null, 2)}\n`);
    }
    return output;
  } finally {
    if (browser) await browser.close();
    await fixture.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const output = await runReproduction({ scenarioId: args.scenarioId, trace: args.trace });
    console.log(JSON.stringify(output, null, 2));
  } catch (error) {
    console.error(`复现运行失败：${error.message}`);
    process.exitCode = 1;
  }
}
