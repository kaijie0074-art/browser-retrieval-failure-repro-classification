# [BR-002] 请求产生但浏览器等待超时

- 状态：`Verified`
- 主分类：`F02 Network transport`
- 场景：`transport-timeout`
- 首次记录：2026-10-12
- 影响：页面发出了检索请求，但在响应到达前因超时显示传输错误。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / en-US / UTC
- fixture 输入：`/?mode=transport-timeout&q=browser`

## 复现步骤

1. 运行 `node scripts/reproduce.mjs --scenario transport-timeout`。
2. 页面发起检索请求。
3. fixture 延迟 700ms，页面的 `AbortSignal.timeout` 在 250ms 触发。

## 预期行为

传输层超时应被记录为可重试性待评估的网络问题；不能伪装成 HTTP 503 或“没有结果”。

## 实际行为

存在 `/api/search` 请求，没有可用 HTTP 响应，页面记录 `transportError=timeout`。

## 证据

```json
{
  "scenario": "transport-timeout",
  "requestAttempted": true,
  "transportError": "timeout",
  "httpStatus": null,
  "networkResponseCount": 0,
  "category": "F02",
  "nextAction": "CHECK_NETWORK_TRANSPORT"
}
```

## 根因假设与排除项

- 当前最强假设：服务端响应延迟超过客户端超时预算。
- 已排除：服务端返回 429/503；本次没有 HTTP 响应可供状态码分类。
- 尚未证明：真实环境中的慢代理、TLS 握手或连接池耗尽属于哪一种具体传输错误；生产数据需记录 requestfailed error text。

## 模拟修复引用

- 修复 ID：`FIX-002`
- 代码位置：`fixtures/search-fixture-server.mjs` 的 `transport-timeout` 分支；`scripts/reproduce.mjs`
- 修复动作：固定 700ms/250ms 时间边界，采集请求、无响应和超时错误。
- 为什么不会把症状改成静默成功：回归必须同时看到 `requestAttempted=true` 和 `httpStatus=null`。

## 回归记录

- 命令：`npm test`
- 断言：`transport-timeout` 分类为 F02、传输错误为 timeout、HTTP 状态为空。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
