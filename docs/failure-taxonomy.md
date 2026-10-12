# 失败分类体系

## 目的

“检索失败”是用户看到的症状，不是根因。分类器先确认链路边界，再用可观察证据决定主分类；一个场景可以有次要信号，但回归记录只断言一个主分类，避免同一故障在不同运行中漂移。

## 链路模型

```text
用户意图
  -> UI 事件派发
  -> 浏览器请求
  -> 传输建立
  -> HTTP 响应
  -> 访问/会话策略
  -> 页面运行时与渲染
  -> 结果语义
  -> 缓存/一致性
  -> 浏览器环境
```

分类顺序不是“严重程度排序”，而是定位的最短证据路径：先判断请求是否产生，再看传输、响应、页面更新和结果内容。

## 分类定义

### F01 — UI dispatch：界面未派发

**触发证据**

- 用户操作已执行；
- 在观察窗口内 `requestAttempted=false`；
- 没有更早的 `consoleErrors` 或页面异常可以解释事件监听器被中断。

**排除条件**：若页面在点击前已经抛出 `pageerror`，优先归为 F05；若网络层显示请求被浏览器 abort，归为 F02。

**下一步**：检查按钮 disabled/loading 状态、事件绑定、表单提交、竞态和客户端状态机。

### F02 — Network transport：网络传输

**触发证据**

- `requestAttempted=true`；
- 没有可用 HTTP 响应；
- `transportError` 为 `timeout`、`aborted`、DNS/TLS、连接重置等。

**下一步**：保留 request/failed 事件，检查代理、DNS、TLS、超时、连接池和重试上限。不能因为重试后成功就抹掉第一次传输失败。

### F03 — HTTP protocol：HTTP 协议

**触发证据**

- 有响应；
- `httpStatus` 不在 200–299；
- 响应不符合 F04 的访问、会话或策略信号。

**典型样例**：500、502、503、格式错误的重定向。

**下一步**：保留状态码、Location、Content-Type、响应体摘要，检查服务端状态和客户端协议契约。

### F04 — Access/session/policy：访问、会话或策略

**触发证据**

- 状态码为 401、403、429；或
- 响应/页面存在 `challenge`、`captcha`、`login`、`blocked` 等明确标记；或
- Crawlee/站点会话语义把该响应标记为 blocked。

**下一步**：检查认证、会话、限流、代理信誉、站点策略和授权边界。不要把挑战页改写成“空结果”，也不要无条件增加重试。

### F05 — Rendering/runtime：渲染或运行时

**触发证据**

- 页面或浏览器上下文出现 `pageerror`/运行时错误；或
- API 已成功返回，但 `uiUpdated=false` 且有脚本错误；或
- 资源/脚本被阻断，导致检索事件链路未注册或结果区域无法更新。

**下一步**：检查 console/pageerror、脚本加载、资源路由、浏览器上下文、DOM 快照和失败动作前后状态。

### F06 — Semantic/content：语义或内容

**触发证据**

- 有 2xx 响应；
- JSON/HTML 可解析；
- 结果计数为 0、字段缺失或 query/result 契约不匹配；
- 没有 F04 的挑战/访问标记。

**下一步**：检查编码后的 query、服务端索引、解析器、分页和“零结果”业务语义。不要重试无法改变输入的纯解析错误。

### F07 — State/cache/consistency：状态、缓存或一致性

**触发证据**

- 结果区显示旧 `requestId`、重复快照或跨场景残留；
- 同一输入在隔离上下文与复用上下文结果不同；
- 去重/缓存命中解释了“没有新请求”或“跳过页面”。

**下一步**：清理并记录 storage state、service worker、HTTP cache、内存缓存和去重键；比较 fresh context 与 reused context。

### F08 — Environment/browser：环境或浏览器

**触发证据**

- 只在特定 browser name/version、locale、timezone、viewport、UA 或扩展组合出现；
- 同一 fixture、同一脚本和同一输入在另一环境通过；
- 证据包含两组可比较的运行元数据。

**下一步**：先锁定最小环境差异，再建立浏览器版本矩阵；不要只用“本机正常”关闭问题。

## 决策表

| 观察 | 主分类 |
| --- | --- |
| 没请求、没脚本错误 | F01 |
| 有请求、无响应、传输错误 | F02 |
| 有非 2xx 响应、无访问策略标记 | F03 |
| 有 401/403/429 或 challenge/login/blocked | F04 |
| 有页面/控制台异常，结果区未更新 | F05 |
| 2xx + 合法内容 + 结果语义错误 | F06 |
| 旧状态、重复内容或跨运行残留 | F07 |
| 只在可比较的环境差异下失败 | F08 |

## 证据模式

```json
{
  "scenario": "http-rate-limit",
  "requestAttempted": true,
  "requestUrl": "/api/search?q=browser",
  "transportError": null,
  "httpStatus": 429,
  "responseHeaders": {
    "retry-after": "3",
    "content-type": "application/json"
  },
  "challengeMarker": false,
  "resultCount": null,
  "uiUpdated": true,
  "consoleErrors": [],
  "browser": {
    "name": "chromium",
    "version": "recorded-at-runtime"
  },
  "category": "F04",
  "nextAction": "检查限流、会话和授权边界；不要盲目重试"
}
```

## 分类器的诚实边界

- 这是“基于证据的首轮分类”，不是自动证明根因。
- 只有一组运行数据时，F08 不能被可靠确认；需要对照环境。
- F03 与 F04 可能都来自相同状态码，必须以挑战/会话/策略标记区分，并在报告中保留不确定性。
- F06 的“空结果”必须结合已知 fixture 预期或业务契约；真实搜索结果为空不自动构成缺陷。
