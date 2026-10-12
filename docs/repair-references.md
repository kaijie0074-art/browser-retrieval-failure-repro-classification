# 模拟修复引用

本页的 FIX 编号是**本模拟项目的内部修复引用**，不是上游开源项目的真实 commit，也不表示真实生产修复已经完成。每个 FIX 都必须能由 `npm test` 的回归断言验证。

| 修复 ID | 关联报告 | 修复位置 | 修复动作 | 回归入口 |
| --- | --- | --- | --- | --- |
| FIX-001 | BR-001 | `fixtures/search-fixture-server.mjs` 的 `ui-dispatch` 分支；`scripts/classifier.mjs` | 保留“未发请求”证据，不把点击无响应伪装成空结果；报告给出 UI 事件链路检查动作 | `ui-no-request` |
| FIX-002 | BR-002 | `fixtures/search-fixture-server.mjs` 的 `transport-timeout` 分支；`scripts/reproduce.mjs` | 固定超时注入和 `transportError=timeout` 采集，验证无 HTTP 状态时归 F02 | `transport-timeout` |
| FIX-003 | BR-003 | `fixtures/search-fixture-server.mjs` 的 `http-rate-limit` 分支；`scripts/classifier.mjs` | 将 429 与 `Retry-After`、访问策略信号归 F04，下一步检查限流/会话而非无限重试 | `http-rate-limit` |
| FIX-004 | BR-004 | `fixtures/search-fixture-server.mjs` 的 `semantic-empty` 分支；`scripts/classifier.mjs` | 只有 2xx、合法 JSON、明确无结果且无挑战标记时归 F06 | `semantic-empty` |
| FIX-005 | BR-005 | `fixtures/search-fixture-server.mjs` 的 `render-crash` 分支；`scripts/reproduce.mjs` | 采集 `pageerror`，把已发请求但 UI 未更新且有脚本异常归 F05 | `render-crash` |
| FIX-006 | BR-006 | `scripts/reproduce.mjs` 的场景断言；`docs/regression-records/` | 记录浏览器、viewport、locale 等环境元数据，避免把环境差异误报为服务端故障 | `happy-path` + 场景矩阵 |

## 引用规则

1. 问题报告先引用 `BR-*`，修复说明再引用 `FIX-*`，回归记录引用具体 scenario ID。
2. 只有代码和回归都存在时，才能把状态写成 `Verified`。
3. 上游参考只写在 `docs/open-source-references.md`；不把上游链接写成模拟项目修复 commit。
