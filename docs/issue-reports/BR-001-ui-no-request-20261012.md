# [BR-001] 点击检索后没有产生请求

- 状态：`Verified`
- 主分类：`F01 UI dispatch`
- 场景：`ui-no-request`
- 首次记录：2026-10-12
- 影响：用户点击 Search 后只看到错误提示，检索服务完全没有收到请求。
- 复现入口：[`docs/reproductions/README.md`](../reproductions/README.md)

## 环境

- OS：Darwin 25.4.0 arm64
- Browser：Chromium（由 Playwright 启动）
- Node.js：24.15.0
- viewport / locale / timezone：1280×720 / en-US / UTC
- fixture 输入：`/?mode=ui-no-request&q=browser`

## 复现步骤

1. 启动 fixture：`npm run reproduce`。
2. 运行 `node scripts/reproduce.mjs --scenario ui-no-request`。
3. 在页面点击 `Search`。

## 预期行为

点击后应产生一个 `GET /api/search` 请求，成功时结果区域显示服务端返回的结果。

## 实际行为

页面显示 `No request dispatched`，但浏览器 network 事件中没有 `/api/search` 请求。

## 证据

```json
{
  "scenario": "ui-no-request",
  "requestAttempted": false,
  "networkRequestCount": 0,
  "httpStatus": null,
  "resultCount": null,
  "uiUpdated": true,
  "consoleErrors": [],
  "pageErrors": [],
  "category": "F01",
  "nextAction": "VERIFY_UI_EVENT_CHAIN"
}
```

## 根因假设与排除项

- 当前最强假设：提交事件在客户端状态机中提前返回，或者事件绑定/按钮状态阻断了请求。
- 已排除：服务端 4xx/5xx、DNS/TLS、响应解析；因为没有请求。
- 尚未证明：真实产品中的按钮 disabled、表单默认提交和竞态是否为同一具体代码路径。

## 模拟修复引用

- 修复 ID：`FIX-001`
- 代码位置：`fixtures/search-fixture-server.mjs` 的 `ui-no-request` 分支；`scripts/classifier.mjs`
- 修复动作：保留“无请求”这一可观测事实，并把它分类为 F01；不生成伪造的空结果。
- 为什么不会把症状改成静默成功：报告保留 `networkRequestCount=0`，回归仍要求该边界成立。

## 回归记录

- 命令：`npm test`
- 断言：`ui-no-request` 分类为 F01、请求数为 0、无 pageerror。
- 记录：[`浏览器检索失败-回归记录-20261012.md`](../regression-records/浏览器检索失败-回归记录-20261012.md)
