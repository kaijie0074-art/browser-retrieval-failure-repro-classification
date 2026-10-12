import assert from 'node:assert/strict';
import { runReproduction } from './reproduce.mjs';
import { scenarios } from './scenario-catalog.mjs';

const output = await runReproduction({ writeEvidence: true });
assert.equal(output.scenarioCount, scenarios.length);

for (const expected of scenarios) {
  const actual = output.results.find((result) => result.scenario === expected.id);
  assert.ok(actual, `缺少场景：${expected.id}`);
  assert.equal(actual.category, expected.expectedCategory, `${expected.id} 分类不符`);
  if (expected.id === 'happy-path') {
    assert.equal(actual.httpStatus, 200);
    assert.equal(actual.resultCount, 2);
    assert.equal(actual.uiUpdated, true);
  }
  if (expected.id === 'ui-no-request') {
    assert.equal(actual.requestAttempted, false);
    assert.equal(actual.pageErrors.length, 0);
  }
  if (expected.id === 'transport-timeout') {
    assert.equal(actual.requestAttempted, true);
    assert.equal(actual.transportError, 'timeout');
    assert.equal(actual.httpStatus, null);
  }
  if (expected.id === 'http-server-error') {
    assert.equal(actual.httpStatus, 503);
    assert.equal(actual.challengeMarker, false);
  }
  if (expected.id === 'http-rate-limit') {
    assert.equal(actual.httpStatus, 429);
    assert.equal(actual.responseHeaders['retry-after'], '3');
  }
  if (expected.id === 'access-challenge') {
    assert.equal(actual.httpStatus, 200);
    assert.equal(actual.challengeMarker, true);
  }
  if (expected.id === 'render-crash') {
    assert.equal(actual.httpStatus, 200);
    assert.ok(actual.consoleErrors.some((message) => message.includes('fixture render failure')));
    assert.equal(actual.uiUpdated, false);
  }
  if (expected.id === 'semantic-empty') {
    assert.equal(actual.httpStatus, 200);
    assert.equal(actual.resultCount, 0);
    assert.equal(actual.semanticMismatch, true);
  }
  if (expected.id === 'stale-state') {
    assert.equal(actual.httpStatus, 200);
    assert.equal(actual.staleState, true);
  }
}

console.log(`回归通过：${output.scenarioCount} 个场景`);
for (const result of output.results) {
  console.log(`${result.scenario.padEnd(20)} ${result.category.padEnd(3)} ${result.nextAction}`);
}
