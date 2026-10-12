# 浏览器检索失败的复现分类和定位：Wayfinder Map

> 状态：已完成
> 建立日期：2026-10-12
> 仓库目标：`browser-retrieval-failure-repro-classification`

## Destination

交付一个公开、可复核的模拟项目：任何新贡献者都能在本地启动确定性的检索页夹具，复现至少六类浏览器检索失败，依据可观测证据完成分类，查看问题报告、修复引用和回归记录，并通过单条命令重跑回归矩阵。

## Notes

- 领域：浏览器自动化、网页检索、失败诊断、回归工程。
- 证据优先：每一类失败必须能落到 UI、请求/响应、页面状态、控制台或运行环境证据；不能用“看起来像”作为完成判据。
- 参考基线：Playwright 的网络拦截与 Trace Viewer、Crawlee 的错误/会话处理、BrowserGym 的任务 setup/validate、Browsertrix Crawler 的跳过原因和报告结构。
- 公开仓库不放真实账号、Cookie、访问令牌、外部站点录制数据或未获授权的个人数据。

## Decisions so far

- 采用本地确定性 fixture + Playwright 浏览器运行器，而不是依赖真实搜索引擎；这样可重复注入超时、HTTP、挑战页和语义空结果。
- 分类采用“主因类别 + 证据字段 + 下一步动作”，不把“空结果”直接等同于网络失败。
- 采用 Public GitHub 仓库；仓库名使用 ASCII slug，文档保留中文项目名。

## Milestones

1. **Evidence baseline**：锁定四个一手开源项目、许可证、可借鉴机制和边界；写入引用清单。
2. **Taxonomy and reports**：建立八类失败分类、问题报告模板和七份示例问题报告。
3. **Executable reproductions**：实现本地检索夹具、Playwright 采集器、分类器和回归脚本。
4. **Repair trail**：每份问题报告链接模拟修复引用 ID、修复动作和验证命令；不冒充真实上游修复。
5. **Regression and delivery**：本地跑通回归矩阵，检查文档链接和敏感信息，再创建并上传公开 GitHub 仓库。

## Acceptance gates

- [x] `npm install` 后可运行 `npm run reproduce`。
- [x] `npm test` 覆盖 happy path 与失败场景，逐场景断言主分类、证据字段和下一步动作。
- [x] 至少六种失败可由本地 fixture 确定性注入；每种均有报告和回归记录。
- [x] 参考项目事实均链接到官方仓库或官方文档；许可证表述不超过来源证据。
- [x] 仓库 README 能让零上下文读者完成安装、复现、回归和阅读路径。
- [x] 上传后的 GitHub 仓库内容与本地验收结果一致；无密钥、Cookie、真实检索数据和生成物噪声。

## Evidence

- 本地 `npm test`：9/9 场景通过，覆盖 `OK`、`F01`–`F07`。
- 本地 `npm run check`：12 个核心文件、19 个 Markdown 文件、9 个场景通过。
- trace 入口已实测：`node scripts/reproduce.mjs --scenario access-challenge --trace`，生成物随后清理。
- GitHub `main` 已推送至提交 `c0ece3b`：https://github.com/kaijie0074-art/browser-retrieval-failure-repro-classification

## Not yet specified

- 首次上传后是否需要补 GitHub Issues / Project Board：本轮不作为交付闸门，文档中的报告已按 Issue 形态组织。
- 后续真实浏览器版本矩阵：本轮只固定 Chromium，跨浏览器矩阵留作扩展，不影响当前确定性回归。

## Out of scope

- 不对真实搜索引擎做压力测试、绕过验证码或规避访问策略。
- 不声称任何开源项目“修复了本模拟项目的具体问题”；只引用其公开机制并记录本项目的模拟修复。
- 不引入生产抓取、账号登录、代理池或云端存储。
