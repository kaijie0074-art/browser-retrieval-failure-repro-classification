# [BR-XXX] 简短、可观察的失败标题

- 状态：`Open | Fixed-simulated | Verified`
- 主分类：`F01–F08`
- 场景：`scenario-id`
- 首次记录：`YYYY-MM-DD`
- 影响：`谁在什么条件下看到了什么症状`
- 复现入口：[`docs/reproductions/...`](../reproductions/)

## 环境

- OS：
- Browser：
- Browser version：
- Node.js：
- viewport / locale / timezone：
- fixture commit 或输入：

## 复现步骤

1.
2.
3.

## 预期行为

<!-- 用可验证的 UI/网络/数据契约描述。 -->

## 实际行为

<!-- 不只写“搜索失败”；写状态码、DOM 状态、结果数、错误等。 -->

## 证据

```json
{
  "scenario": "",
  "requestAttempted": false,
  "transportError": null,
  "httpStatus": null,
  "resultCount": null,
  "uiUpdated": false,
  "consoleErrors": []
}
```

## 根因假设与排除项

- 当前最强假设：
- 已排除：
- 尚未证明：

## 模拟修复引用

- 修复 ID：`FIX-XXX`
- 代码位置：
- 修复动作：
- 为什么不会把症状改成静默成功：

## 回归记录

- 命令：`npm test`
- 断言：
- 记录：[`docs/regression-records/...`](../regression-records/)
