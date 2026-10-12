# [BR-003] 检索服务返回 503

- 状态：`Verified`
- 主分类：`F03 HTTP protocol`
- 场景：`http-server-error`
- 首次记录：2026-10-12
- 影响：检索服务明确返回临时服务错误，客户端需要展示协议层失败而不是空结果。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / en-US / UTC
- fixture 输入：`/?mode=http-server-error&q=browser`

## 复现步骤

1. 运行 `node scripts/reproduce.mjs --scenario http-server-error`。
2. 点击 `Search`。
3. 观察 network response status 和页面状态。

## 预期行为

客户端应保留 503、响应头和错误上下文，并把问题交给服务端健康检查或有限重试策略。

## 实际行为

请求存在，响应状态为 503；没有 challenge、login 或限流标记。

## 证据

```json
{
  "scenario": "http-server-error",
  "requestAttempted": true,
  "httpStatus": 503,
  "challengeMarker": false,
  "transportError": null,
  "category": "F03",
  "nextAction": "CHECK_HTTP_SERVICE"
}
```

## 根因假设与排除项

- 当前最强假设：上游检索服务不可用或服务端正在维护。
- 已排除：浏览器未发请求、传输无响应、访问挑战；均与证据不符。
- 尚未证明：真实服务是否把 503 作为可重试状态，需要查看服务契约和 Retry-After。

## 模拟修复引用

- 修复 ID：`FIX-003`（普通 HTTP 错误分支）
- 代码位置：`fixtures/search-fixture-server.mjs` 的 `http-server-error` 分支；`scripts/classifier.mjs`
- 修复动作：只有没有 F04 访问策略信号时，非 2xx 才归 F03。
- 为什么不会把症状改成静默成功：证据保留 503，不把响应转换为 200 空数组。

## 回归记录

- 命令：`npm test`
- 断言：`http-server-error` 分类为 F03、状态为 503、challengeMarker 为 false。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
