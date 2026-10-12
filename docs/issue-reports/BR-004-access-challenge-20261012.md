# [BR-004] 检索被限流或挑战页拦截

- 状态：`Verified`
- 主分类：`F04 Access/session/policy`
- 场景：`http-rate-limit`、`access-challenge`
- 首次记录：2026-10-12
- 影响：请求可能有 HTTP 响应，甚至返回 200，但实际内容是访问策略信号，不是检索结果。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / en-US / UTC
- fixture 输入：`/?mode=http-rate-limit&q=browser` 或 `/?mode=access-challenge&q=browser`

## 复现步骤

1. 运行 `node scripts/reproduce.mjs --scenario http-rate-limit`。
2. 再运行 `node scripts/reproduce.mjs --scenario access-challenge`。
3. 比较状态码、`Retry-After`、`x-search-challenge` 和结果数量。

## 预期行为

客户端应把限流、挑战、登录或 blocked 内容归入访问/会话/策略层，并根据授权和站点规则处理；不能把它报告为普通空结果。

## 实际行为

- `http-rate-limit`：429 + `Retry-After: 3`。
- `access-challenge`：200 + `challenge=true` + `x-search-challenge`，但没有结果。

## 证据

```json
{
  "scenario": "http-rate-limit",
  "requestAttempted": true,
  "httpStatus": 429,
  "responseHeaders": { "retry-after": "3" },
  "challengeMarker": false,
  "category": "F04",
  "nextAction": "CHECK_ACCESS_SESSION_POLICY"
}
```

## 根因假设与排除项

- 当前最强假设：会话、代理信誉、限流窗口或站点访问策略导致结果不可用。
- 已排除：不能仅凭 200 判定成功；`access-challenge` 明确返回 challenge marker。
- 尚未证明：真实站点的挑战页面标记和合规处理方式，需要站点授权与契约。

## 模拟修复引用

- 修复 ID：`FIX-004`
- 代码位置：`fixtures/search-fixture-server.mjs` 的 `http-rate-limit`/`access-challenge` 分支；`scripts/classifier.mjs`
- 修复动作：优先判断 401/403/429 和 challenge marker，再判断普通非 2xx。
- 为什么不会把症状改成静默成功：保留响应头和 marker，并给出“检查会话/策略、不要盲目重试”的动作。

## 回归记录

- 命令：`npm test`
- 断言：两个场景均为 F04；429 保留 Retry-After，200 challenge 保留 marker。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
