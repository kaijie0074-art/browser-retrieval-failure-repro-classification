const actions = {
  OK: 'NONE',
  F01: 'VERIFY_UI_EVENT_CHAIN',
  F02: 'CHECK_NETWORK_TRANSPORT',
  F03: 'CHECK_HTTP_SERVICE',
  F04: 'CHECK_ACCESS_SESSION_POLICY',
  F05: 'CHECK_RENDER_RUNTIME',
  F06: 'CHECK_QUERY_AND_CONTENT_CONTRACT',
  F07: 'CHECK_CACHE_AND_STATE',
  F08: 'COMPARE_BROWSER_ENVIRONMENTS',
};

export function classifyEvidence(evidence) {
  if (evidence.pageErrors?.length || evidence.consoleErrors?.length && !evidence.requestAttempted) {
    return result('F05', evidence, '页面运行时异常阻断了事件链路');
  }
  if (!evidence.requestAttempted) {
    return result('F01', evidence, '操作发生但没有产生检索请求');
  }
  if (evidence.transportError) {
    return result('F02', evidence, '请求产生但没有拿到可用 HTTP 响应');
  }
  if (evidence.challengeMarker || [401, 403, 429].includes(evidence.httpStatus)) {
    return result('F04', evidence, '响应包含访问、会话或限流信号');
  }
  if (Number.isInteger(evidence.httpStatus) && (evidence.httpStatus < 200 || evidence.httpStatus >= 300)) {
    return result('F03', evidence, '响应状态码不是成功状态且没有访问策略信号');
  }
  if (evidence.staleState) {
    return result('F07', evidence, '响应或页面明确表明结果来自旧状态');
  }
  if (evidence.pageErrors?.length || evidence.consoleErrors?.length && !evidence.uiUpdated) {
    return result('F05', evidence, '响应后页面运行时异常导致结果区未完成更新');
  }
  if (evidence.semanticMismatch) {
    return result('F06', evidence, '响应成功但内容不满足检索语义契约');
  }
  return result('OK', evidence, '链路和结果语义均通过基线检查');
}

function result(category, evidence, reason) {
  return {
    category,
    reason,
    nextAction: actions[category],
  };
}

export { actions };
