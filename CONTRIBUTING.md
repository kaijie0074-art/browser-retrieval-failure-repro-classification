# 贡献指南

## 新增一个失败场景

1. 在 `fixtures/search-fixture-server.mjs` 增加一个稳定的 `mode`，不依赖外网。
2. 在 `scripts/scenario-catalog.mjs` 增加唯一场景 ID、预期分类、证据字段和下一步动作。
3. 在 `docs/reproductions/` 写出输入、步骤、预期、实际和清理方式。
4. 在 `docs/issue-reports/` 按模板写问题报告，并给出 `BR-*` 编号。
5. 在 `docs/repair-references.md` 增加 `FIX-*` 引用。
6. 运行 `npm run reproduce`、`npm test`、`npm run check`，把命令和结果写进 `docs/regression-records/`。

## 证据规则

- 记录可观察事实：请求是否产生、传输错误、状态码、响应头、DOM 状态、结果数量、console/pageerror 和环境元数据。
- 不把猜测写入 evidence 字段；根因假设必须单独标记。
- 不提交真实 Cookie、Authorization、代理凭据、验证码、访问令牌或第三方站点录制。
- 失败报告必须区分“访问策略/会话”与“普通 HTTP 错误”，不能用无限重试掩盖问题。

## 代码与文档检查

```bash
npm install
npx playwright install chromium
npm run reproduce
npm test
npm run check
```

提交前确认生成的截图、trace、`node_modules` 和本机日志未进入 Git。
