# [BR-007] 请求成功但页面保留旧检索状态

- 状态：`Verified`
- 主分类：`F07 State/cache/consistency`
- 场景：`stale-state`
- 首次记录：2026-10-12
- 影响：用户已触发新检索，但页面继续显示旧 requestId 对应的结果，造成“检索没有生效”的症状。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / UTC
- fixture 输入：`/?mode=stale-state&q=browser`

## 复现步骤

1. 运行 `node scripts/reproduce.mjs --scenario stale-state`。
2. 页面收到 200 JSON。
3. 检查 response 中的 `requestId`、`staleState` 和结果区行为。

## 预期行为

新请求的结果必须带有与当前查询对应的新状态；如果检测到旧状态，应停止把它当作新结果并保留诊断证据。

## 实际行为

响应明确带有 `old-request-001` 和 `staleState=true`，页面保留旧结果并显示 stale 状态。

## 证据

```json
{
  "scenario": "stale-state",
  "requestAttempted": true,
  "httpStatus": 200,
  "staleState": true,
  "category": "F07",
  "nextAction": "CHECK_CACHE_AND_STATE"
}
```

## 根因假设与排除项

- 当前最强假设：缓存、service worker、复用的 browser context 或请求去重键使旧状态覆盖新状态。
- 已排除：无请求、传输错误、非 2xx 和渲染异常。
- 尚未证明：真实系统中的具体状态源，需要 fresh context 与 reused context 对照。

## 模拟修复引用

- 修复 ID：`FIX-007`
- 代码位置：`fixtures/search-fixture-server.mjs` 的 `stale-state` 分支；`scripts/reproduce.mjs` 的全新 context 设置。
- 修复动作：把旧 requestId/stale marker 作为一等证据，并固定每个场景使用新 context。
- 为什么不会把症状改成静默成功：页面明确展示 stale 状态，回归保留 `staleState=true`。

## 回归记录

- 命令：`npm test`
- 断言：`stale-state` 为 F07、状态 200、staleState 为 true。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
