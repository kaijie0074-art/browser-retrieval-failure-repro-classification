# [BR-006] HTTP 成功但结果语义为空

- 状态：`Verified`
- 主分类：`F06 Semantic/content`
- 场景：`semantic-empty`
- 首次记录：2026-10-12
- 影响：接口返回合法 JSON 和 200，页面却得到违反本场景契约的空结果；这不是网络故障。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / UTC
- fixture 输入：`/?mode=semantic-empty&q=browser`

## 复现步骤

1. 运行 `node scripts/reproduce.mjs --scenario semantic-empty`。
2. 页面收到 `200 application/json`。
3. 检查 `resultCount`、`semanticMismatch` 和分类结果。

## 预期行为

在本场景契约中，查询 `browser` 应至少返回一条结果；若服务端返回空数组，应按内容/语义契约问题定位，而不是重试网络。

## 实际行为

响应合法且状态为 200，但 `results=[]`、`semanticMismatch=true`，页面显示 `Semantic mismatch: zero results`。

## 证据

```json
{
  "scenario": "semantic-empty",
  "requestAttempted": true,
  "httpStatus": 200,
  "resultCount": 0,
  "semanticMismatch": true,
  "challengeMarker": false,
  "category": "F06",
  "nextAction": "CHECK_QUERY_AND_CONTENT_CONTRACT"
}
```

## 根因假设与排除项

- 当前最强假设：query 编码、索引、解析器或零结果业务语义不符合契约。
- 已排除：网络、HTTP 和访问挑战；这些证据均正常/不存在。
- 尚未证明：真实业务的零结果是否一定是缺陷，需要产品契约或基线数据。

## 模拟修复引用

- 修复 ID：`FIX-006`
- 代码位置：`fixtures/search-fixture-server.mjs` 的 `semantic-empty` 分支；`scripts/classifier.mjs`
- 修复动作：只有存在明确语义不匹配证据时才归 F06，不把所有 `resultCount=0` 自动当作错误。
- 为什么不会把症状改成静默成功：证据保留空数组和语义标记，并在 taxonomy 中说明真实零结果需要契约。

## 回归记录

- 命令：`npm test`
- 断言：`semantic-empty` 为 F06、状态 200、结果数 0、semanticMismatch 为 true。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
