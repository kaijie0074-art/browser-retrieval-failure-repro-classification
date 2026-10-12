export const scenarios = [
  {
    id: 'happy-path',
    mode: 'happy',
    query: 'browser',
    expectedCategory: 'OK',
    description: '正常返回两个结果，作为基线。',
  },
  {
    id: 'ui-no-request',
    mode: 'ui-no-request',
    query: 'browser',
    expectedCategory: 'F01',
    description: '点击后 UI 更新了提示，但没有产生检索请求。',
  },
  {
    id: 'transport-timeout',
    mode: 'transport-timeout',
    query: 'browser',
    expectedCategory: 'F02',
    description: '请求产生，但 fixture 延迟响应，页面超时中止。',
  },
  {
    id: 'http-server-error',
    mode: 'http-server-error',
    query: 'browser',
    expectedCategory: 'F03',
    description: '服务端返回 503，且没有访问策略标记。',
  },
  {
    id: 'http-rate-limit',
    mode: 'http-rate-limit',
    query: 'browser',
    expectedCategory: 'F04',
    description: '服务端返回 429 和 Retry-After，模拟限流。',
  },
  {
    id: 'access-challenge',
    mode: 'access-challenge',
    query: 'browser',
    expectedCategory: 'F04',
    description: 'HTTP 200，但响应带有明确 challenge marker。',
  },
  {
    id: 'render-crash',
    mode: 'render-crash',
    query: 'browser',
    expectedCategory: 'F05',
    description: 'API 成功返回，但渲染阶段抛出 page error。',
  },
  {
    id: 'semantic-empty',
    mode: 'semantic-empty',
    query: 'browser',
    expectedCategory: 'F06',
    description: 'HTTP 200、JSON 合法，但结果契约要求至少一条而实际为空。',
  },
  {
    id: 'stale-state',
    mode: 'stale-state',
    query: 'browser',
    expectedCategory: 'F07',
    description: '请求成功，但 fixture 明确返回旧 requestId，页面保留旧状态。',
  },
];

export function getScenarios(scenarioId) {
  if (!scenarioId) return scenarios;
  const scenario = scenarios.find((item) => item.id === scenarioId);
  if (!scenario) {
    throw new Error(`未知场景：${scenarioId}。可选值：${scenarios.map((item) => item.id).join(', ')}`);
  }
  return [scenario];
}
