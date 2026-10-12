# 模拟修复引用

本页的 FIX 编号是**本模拟项目的内部修复引用**，不是上游开源项目的真实 commit，也不表示真实生产修复已经完成。每个 FIX 都必须能由 `npm test` 的回归断言验证。

| 修复 ID | 关联报告 | 修复位置 | 修复动作 | 回归入口 |
| --- | --- | --- | --- | --- |
| FIX-001 | BR-001 | `fixtures/search-fixture-server.mjs` 的 `ui-dispatch` 分支；`scripts/classifier.mjs` | 保留“未发请求”证据，不把点击无响应伪装成空结果；报告给出 UI 事件链路检查动作 | `ui-no-request` |
| FIX-002 | BR-002 | `fixtures/search-fixture-server.mjs` 的 `transport-timeout` 分支；`scripts/reproduce.mjs` | 固定超时注入和 `transportError=timeout` 采集，验证无 HTTP 状态时归 F02 | `transport-timeout` |
| FIX-003 | BR-003 | `fixtures/search-fixture-server.mjs` 的 `http-server-error` 分支；`scripts/classifier.mjs` | 将没有访问策略标记的 503 归 F03，保留 HTTP 状态而不是伪装成空结果 | `http-server-error` |
| FIX-004 | BR-004 | `fixtures/search-fixture-server.mjs` 的 `http-rate-limit`/`access-challenge` 分支；`scripts/classifier.mjs` | 优先判断 401/403/429 和 challenge marker，再判断普通非 2xx；下一步检查会话/策略而非无限重试 | `http-rate-limit` + `access-challenge` |
| FIX-005 | BR-005 | `fixtures/search-fixture-server.mjs` 的 `render-crash` 分支；`scripts/reproduce.mjs` | 采集 `pageerror`/console error，把已发请求但 UI 未更新且有脚本异常归 F05 | `render-crash` |
| FIX-006 | BR-006 | `fixtures/search-fixture-server.mjs` 的 `semantic-empty` 分支；`scripts/classifier.mjs` | 只有存在明确语义不匹配证据时才归 F06，不把所有 `resultCount=0` 自动当作错误 | `semantic-empty` |
| FIX-007 | BR-007 | `fixtures/search-fixture-server.mjs` 的 `stale-state` 分支；`scripts/reproduce.mjs` | 记录旧 requestId/stale marker，并固定新 browser context，避免把旧状态当作新结果 | `stale-state` |

## 引用规则

1. 问题报告先引用 `BR-*`，修复说明再引用 `FIX-*`，回归记录引用具体 scenario ID。
2. 只有代码和回归都存在时，才能把状态写成 `Verified`。
3. 上游参考只写在 `docs/open-source-references.md`；不把上游链接写成模拟项目修复 commit。
