# 回归记录

每次可复现矩阵执行后，在本目录新增一份按日期命名的记录，格式为 `浏览器检索失败-回归记录-YYYYMMDD.md`。记录必须包含：

- 执行时间、OS、Node.js、Playwright、Chromium 版本；
- 实际命令；
- 场景数量和逐场景分类；
- 关键边界证据（无请求、无响应、非 2xx、挑战标记、pageerror、空结果、旧状态）；
- 失败时的下一步定位动作；
- 生成物和已知限制。

最新一次执行的机器可读证据在 [`evidence/latest-run.json`](../../evidence/latest-run.json)。
