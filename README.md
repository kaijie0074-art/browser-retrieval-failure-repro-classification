# 浏览器检索失败的复现分类和定位

一个**确定性、本地可运行**的模拟项目：用受控网页夹具注入浏览器检索链路中的典型失败，采集请求、响应、页面状态和控制台证据，再把失败归入可行动的主分类。

> 这不是搜索引擎，也不连接真实搜索账号或第三方检索站点。项目只用于问题报告、复现材料、修复引用和回归记录的工程演练。

## 你会得到什么

- 一套按证据划分的八类失败分类，而不是把所有“没有结果”都叫网络问题。
- 一个本地 fixture（测试夹具：专门制造稳定输入和故障的最小服务），覆盖成功、未发请求、超时、HTTP 错误、访问挑战、语义空结果和渲染错误。
- 一个 Playwright 采集器：保存请求/响应、DOM 状态、控制台错误、运行环境和分类结果。
- 七份示例问题报告，以及每份报告对应的模拟修复引用和回归记录。
- 不依赖外网的回归矩阵；外网只用于阅读 `docs/open-source-references.md` 中的官方资料。

## 快速开始

要求：Node.js 20+、npm、可由 Playwright 安装的 Chromium。

```bash
npm install
npx playwright install chromium
npm run reproduce
npm test
```

- `npm run reproduce`：启动本地 fixture，逐场景运行浏览器采集器，把结构化结果写到标准输出，并更新 `evidence/latest-run.json`。
- `npm test`：运行回归矩阵；每个场景断言预期主分类、关键证据和建议动作。
- `npm run check`：检查文档、脚本入口、分类 ID 和修复引用是否齐全。

如果只想跑单个场景：

```bash
node scripts/reproduce.mjs --scenario http-rate-limit
```

## 失败分类总览

| ID | 主分类 | 关键证据 | 首要动作 |
| --- | --- | --- | --- |
| F01 | UI dispatch（界面未派发） | 点击后没有请求，且没有先发生脚本错误 | 检查按钮状态、事件绑定和提交状态机 |
| F02 | Network transport（网络传输） | 请求已产生，但出现 abort、timeout、DNS/TLS 或连接错误 | 检查网络事件、代理、超时和重试边界 |
| F03 | HTTP protocol（HTTP 协议） | 请求有响应，但状态码为非 2xx 且不是访问策略信号 | 检查服务端状态、重定向和响应契约 |
| F04 | Access/session/policy（访问/会话/策略） | 401/403/429、挑战页、登录页或明确 blocked marker | 检查会话、权限、限流和站点策略；不要盲目重试 |
| F05 | Rendering/runtime（渲染/运行时） | 页面或控制台有异常，导致结果区域没有按响应更新 | 检查 JS 异常、资源阻断和浏览器上下文 |
| F06 | Semantic/content（语义/内容） | HTTP 2xx、JSON 合法，但结果集合与查询契约不符 | 检查查询参数、解析器、索引和空结果语义 |
| F07 | State/cache/consistency（状态/缓存/一致性） | 显示旧 requestId、重复快照或跨运行残留状态 | 检查缓存、service worker、存储隔离和去重键 |
| F08 | Environment/browser（环境/浏览器） | 只在特定浏览器、版本、区域、语言或 viewport 出现 | 固定并比较浏览器环境，建立最小矩阵 |

完整决策规则见 [`docs/failure-taxonomy.md`](docs/failure-taxonomy.md)。

## 复现与阅读路径

1. 先读 [`work/wayfinder-map.md`](work/wayfinder-map.md)，了解范围、验收闸门和明确不做的事情。
2. 再读 [`docs/open-source-references.md`](docs/open-source-references.md)，查看四个开源项目的**一手资料**、借鉴点和边界。
3. 用 [`docs/reproductions/README.md`](docs/reproductions/README.md) 了解每个 fixture 场景如何注入故障。
4. 用 [`docs/issue-reports/`](docs/issue-reports/) 查看报告：环境 → 步骤 → 预期/实际 → 证据 → 根因假设 → 修复引用 → 回归入口。
5. 用 [`docs/repair-references.md`](docs/repair-references.md) 追踪模拟修复与代码位置。
6. 用 [`docs/regression-records/`](docs/regression-records/) 查看已执行命令和结果。

## 目录

```text
fixtures/                         本地检索页面与 API 故障夹具
scripts/                          浏览器采集、分类、回归、完整性检查
docs/failure-taxonomy.md          分类规则、排除条件、证据模式
docs/open-source-references.md    Playwright/Crawlee/BrowserGym/Browsertrix 引用
docs/issue-reports/                示例问题报告
docs/reproductions/                逐场景复现说明
docs/repair-references.md          模拟修复引用表
docs/regression-records/           回归执行记录
docs/templates/                    新问题报告模板
evidence/latest-run.json          最近一次本地回归的结构化证据
work/                              任务地图和验收记录
```

## 证据约定

采集器输出的每个场景至少包含：`scenario`、`requestAttempted`、`requestUrl`、`transportError`、`httpStatus`、`responseHeaders`、`resultCount`、`uiUpdated`、`consoleErrors`、`browser`、`category`、`nextAction`。分类器只使用这些可观察字段，不读取“根因声明”作为证据。

截图和 Playwright trace 属于可能包含页面内容的生成物，默认写入 `evidence/generated/` 并被 `.gitignore` 忽略；公开仓库只保留脱敏后的 JSON 证据和可重跑脚本。

## 参考与许可证边界

本项目没有复制四个参考项目的源代码；只记录公开机制和链接。参考项目及许可证以 [`docs/open-source-references.md`](docs/open-source-references.md) 为准。本项目自身采用 MIT License。

## 安全边界

- 不提交真实 Cookie、Authorization、代理凭据、验证码、访问令牌或用户数据。
- 不对真实站点压测，不绕过访问控制，不把挑战页当作可重试网络错误。
- 若把 fixture 替换为真实站点，必须先重新做授权、隐私和数据保留评审。
