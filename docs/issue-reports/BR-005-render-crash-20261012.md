# [BR-005] API 成功但渲染阶段抛出异常

- 状态：`Verified`
- 主分类：`F05 Rendering/runtime`
- 场景：`render-crash`
- 首次记录：2026-10-12
- 影响：检索 API 已返回 200，但页面结果区没有完成更新，用户看到的是“检索失败”症状。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / en-US / UTC
- fixture 输入：`/?mode=render-crash&q=browser`

## 复现步骤

1. 运行 `node scripts/reproduce.mjs --scenario render-crash`。
2. 页面收到 200 JSON 后，在渲染分支抛出 `fixture render failure`。
3. 观察 console error 和 UI 更新标记。

## 预期行为

客户端应记录页面运行时异常和响应上下文，把问题定位到渲染层，而不是重试已经成功的 HTTP 请求。

## 实际行为

请求和 200 响应均存在，Playwright 采集到 console error，`uiUpdated=false`。

## 证据

```json
{
  "scenario": "render-crash",
  "requestAttempted": true,
  "httpStatus": 200,
  "consoleErrors": ["fixture render failure after successful response"],
  "uiUpdated": false,
  "category": "F05",
  "nextAction": "CHECK_RENDER_RUNTIME"
}
```

## 根因假设与排除项

- 当前最强假设：客户端渲染逻辑在消费响应后抛出异常。
- 已排除：传输失败和 HTTP 服务失败；请求与 200 响应都被观察到。
- 尚未证明：真实产品中是否为组件异常、序列化异常或资源加载错误。

## 模拟修复引用

- 修复 ID：`FIX-005`
- 修复动作：采集 pageerror/console error，并在响应成功但 UI 未更新时归 F05。
- 为什么不会把症状改成静默成功：回归明确要求存在 console error 且 `uiUpdated=false`。

## 回归记录

- 命令：`npm test`
- 断言：`render-crash` 为 F05、HTTP 200、console error 包含 fixture render failure。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
