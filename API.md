# 模型网关 / Model gateway

运行 `npm start` 后，前端与 API 均位于 `http://127.0.0.1:61321`。GitHub Pages 只托管静态文件，不托管 API。

## 配置模型

复制 `models.example.json`，通过环境变量 `ZHIYAN_MODELS_FILE` 指向配置路径。每项包含：

```json
{
  "id": "my-claude",
  "label": "Claude / Research",
  "vendor": "Claude",
  "provider": "anthropic",
  "model": "YOUR_AVAILABLE_MODEL_ID",
  "source": "cloud",
  "baseUrl": "https://api.anthropic.com/v1",
  "keyEnv": "ANTHROPIC_API_KEY"
}
```

`provider` 支持 `gemini`、`anthropic`、`openai-compatible`。模型型号来自自己的账户或本地安装，示例不保证可用。更换配置后刷新网关模型列表。密钥设置在对应服务端环境变量；配置文件只写变量名。

本地 Llama / Qwen 可使用 Ollama 的 `http://127.0.0.1:11434/v1`；LM Studio 使用 `http://127.0.0.1:1234/v1`。本地服务可以省略 `keyEnv`。

示例目录覆盖 30 个型号、17 个模型家族或接入入口。服务端注册表最多容纳 500 项，新增条目无需改前端；同一模型可注册不同部署并分配不同 `id`。

| 字段 | 用途 |
| --- | --- |
| `vendor` | 提供商／模型家族名称，用于筛选与分组 |
| `source` | `cloud` 或 `local`，表示部署位置 |
| `requiresModelId` | 占位条目为 `true`；替换实际型号后改为 `false`，否则禁止调用 |
| `tokenParameter` | 兼容协议默认 `max_tokens`；需要时设为 `max_completion_tokens` |
| `maxOutputTokens` | 输出预算，默认 800，范围 1–16384；推理型号可配置更高预算 |

运行 `node scripts/build-model-catalog.cjs` 可从示例注册表更新静态网站的目录。生成文件不包含密钥、环境变量名称或服务地址。连接网关后，页面自动使用网关注册表。

## GET /api/models

返回无密钥的模型注册表：`id`、`label`、`vendor`、`provider`、`model`、`source`、`configured`、`status`。
“configured”仅表示配置就绪；实际提供商连通性在请求时验证。

## POST /api/agent-response

```json
{
  "model": "my-claude",
  "persona": {"name": "林悦", "segment": "价格敏感新客", "status": "浏览新品"},
  "question": "这个方案会怎样影响你的选择？",
  "strategy": "会员定向优惠",
  "context": "周末滨水集市"
}
```

成功返回 `answer`、`model`、`provider`、`elapsedMs`、`usage`、`source: model-provider` 和 `changesBusinessMetrics: false`。

- 400：JSON、人物字段、问题或型号无效；请求上限 16 KB。
- 403：来源不允许。
- 429：已有两个模型请求在处理。
- 503：提供商密钥缺失，或仍使用待填写的型号占位条目。
- 502：提供商报错、缺少文本或超过 30 秒。

服务只监听本机 127.0.0.1。允许本机前端和 kzczc.github.io；不接受浏览器提交任意上游 URL。错误不会返回密钥或提供商完整响应。需要公网服务时，应另行加入用户认证、配额和访问审计。

## 执行边界

网关实现逐人物模型解释，业务指标继续由浏览器确定性模型计算。当前没有 `/v1/simulations` 批量任务服务；此前文档中的该路径是设计草案，不是已发布接口。
