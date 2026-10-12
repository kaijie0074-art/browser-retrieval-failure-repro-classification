# 开源项目引用与借鉴边界

本页只引用官方仓库、官方文档和官方源码。这里的“借鉴”指采用问题拆解或证据组织方式，不代表复制代码，也不代表这些项目已经修复本模拟项目中的缺陷。

## 1. Microsoft Playwright

- 仓库：[microsoft/playwright](https://github.com/microsoft/playwright)
- 许可证：官方仓库标注 **Apache License 2.0**，见 [官方仓库](https://github.com/microsoft/playwright) 的 License 信息。
- 一手资料：
  - [Network](https://playwright.dev/docs/network)：跟踪/修改 HTTP(S)、XHR、Fetch，请求、响应、路由和 abort。
  - [Mock APIs / HAR](https://playwright.dev/docs/mock)：记录 HAR、提交到版本库并回放；HAR 匹配 URL、HTTP method，POST 还会严格匹配 payload。
  - [Trace Viewer](https://playwright.dev/docs/trace-viewer)：查看动作、DOM snapshots、source、console、network、metadata 和 attachments。
- 本项目借鉴：把“请求是否产生”“响应状态”“页面动作前后 DOM”“控制台错误”放入同一份证据；用本地 fixture 替代真实 API，让失败可重复。
- 映射分类：F01、F02、F03、F05；HAR/route 也支持稳定制造这些场景。
- 边界：Playwright 提供观测和控制能力，不会替项目决定真实业务上的根因；Trace 看到网络请求不等于证明服务端数据正确。

## 2. Apify Crawlee

- 仓库：[apify/crawlee](https://github.com/apify/crawlee)
- 许可证：官方仓库标注 **Apache License 2.0**，见 [仓库 README 的 License](https://github.com/apify/crawlee#license) 和 [LICENSE.md](https://github.com/apify/crawlee/blob/master/LICENSE.md)。
- 一手资料：
  - [官方仓库 README](https://github.com/apify/crawlee)：说明 HTTP/headless browser 统一接口、proxy rotation、session management、routing、error handling、retries。
  - [Python Error handling guide](https://crawlee.dev/python/docs/guides/error-handling)：区分代理/网络错误、HTTP 状态、解析错误；示例只对网络相关错误重试，并可在非网络错误时停止重试。
  - [JavaScript Session Management](https://crawlee.dev/js/docs/guides/session-management)：SessionPool 记录 cookie、auth token、headers，并过滤 blocked/non-working sessions。
- 本项目借鉴：把网络失败、HTTP 状态、访问策略、解析/语义错误分开；在 F04 的建议动作里明确“先检查会话/策略，不要无条件重试”。
- 映射分类：F02、F03、F04、F06、F07。
- 边界：Crawlee 的重试与 session 机制不能替代本项目的浏览器 DOM/console 证据；示例中的站点策略判断需要实际站点契约，不能凭状态码单独推断。

## 3. ServiceNow BrowserGym

- 仓库：[ServiceNow/BrowserGym](https://github.com/ServiceNow/BrowserGym)
- 许可证：官方仓库的 [LICENSE](https://raw.githubusercontent.com/ServiceNow/BrowserGym/main/LICENSE) 为 Apache License 2.0。
- 一手资料：
  - [官方 README](https://github.com/ServiceNow/BrowserGym)：将浏览器操作组织成 benchmark task，并列出多个可复用 benchmark。
  - [AbstractBrowserTask 源码](https://github.com/ServiceNow/BrowserGym/blob/main/browsergym/core/src/browsergym/core/task.py)：任务包含 seed、viewport、timeout、`setup(page)`、`validate(page, chat_messages)` 和可选 teardown。
- 本项目借鉴：每个故障场景都有稳定 ID、确定性 setup、显式预期和 validate 式回归判据；把“复现成功”定义为物理观察值匹配，而非只看脚本退出码。
- 映射分类：全部分类的场景建模，尤其 F08 的环境元数据和回归矩阵。
- 边界：BrowserGym 是 web-agent 任务环境/benchmark，不是检索失败诊断器；其 reward/validate 不能替代本项目对网络和内容证据的采集。

## 4. Webrecorder Browsertrix Crawler

- 仓库：[webrecorder/browsertrix-crawler](https://github.com/webrecorder/browsertrix-crawler)
- 许可证：官方仓库标注 **GNU Affero General Public License v3.0**，见 [官方仓库 README](https://github.com/webrecorder/browsertrix-crawler) 和 [LICENSE](https://github.com/webrecorder/browsertrix-crawler/blob/main/LICENSE)。
- 一手资料：
  - [Reports](https://crawler.docs.browsertrix.com/user-guide/reports/)：用 JSONL 记录跳过页面及 `outOfScope`、`pageLimit`、`robotsTxt`、`redirectToExcluded`、`duplicate` 等原因。
  - [Deduplication](https://crawler.docs.browsertrix.com/user-guide/dedupe/)：区分 URL 去重、内容去重、revisit 记录和页面级跳过，并说明并发失败时的提交/清理权衡。
  - [官方仓库 README](https://github.com/webrecorder/browsertrix-crawler)：说明其高保真、浏览器化抓取和 CDP 数据捕获定位。
- 本项目借鉴：把“跳过/未加载/重复内容”记录成有枚举原因的结构化报告；为 F07 保留 requestId、状态残留和去重边界。
- 映射分类：F04、F07，以及“没有内容”症状的排除条件。
- 边界：Browsertrix 面向网页存档/抓取，不是本项目的检索页面实现；本项目没有复制其 AGPL 代码，若未来复制代码必须单独做许可证合规评审。

## 机制到本项目的映射

| 外部机制 | 本项目的落点 | 不声称的内容 |
| --- | --- | --- |
| Playwright network/trace/HAR | `scripts/reproduce.mjs` 的采集字段与本地可重复故障 | 不声称 trace 自动给出根因 |
| Crawlee retry/session/error handling | F02/F03/F04/F06 的分层和下一步动作 | 不声称重试能解决访问策略 |
| BrowserGym setup/validate | fixture 场景 ID、固定预期、回归判据 | 不声称本项目是 benchmark 复刻 |
| Browsertrix reports/dedupe | skip reason、重复内容和状态一致性字段 | 不声称本项目提供网页存档能力 |

## 引用与许可证纪律

- 只复制项目名称、链接、事实摘要和少量必要术语；不复制源代码、截图或未授权数据。
- 本项目 MIT 许可证不改变四个外部项目各自的许可证；若未来引入代码或生成物，必须重新核实归属、NOTICE、许可证兼容性和数据授权。
