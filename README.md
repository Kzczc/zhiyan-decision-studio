<div align="center">

<img src="docs/assets/logo-horizontal.svg" width="310" alt="智演 ZHIYAN">

# 智演 · 让策略先经过预演

**更快探索 · 更省试错 · 更可解释**

[**中文**](README.md) ｜ [English](README.en.md)

[🌐 在线体验](https://kzczc.github.io/zhiyan-decision-studio/) · [🎬 产品演示](https://kzczc.github.io/zhiyan-decision-studio/demo.html) · [模型接入](API.md) · [关于智演](https://kzczc.github.io/zhiyan-decision-studio/brand.html)

</div>

<a href="https://kzczc.github.io/zhiyan-decision-studio/demo.html"><img src="docs/assets/demo-cover.png" width="100%" alt="观看智演双语产品演示"></a>

**智演 ZHIYAN** 面向企业增长、商户经营和公共服务决策。将候选策略、人群画像与资源约束放进可观察的城市场景，在真实试点前比较方案，形成下一步验证计划。

> 技术目标：将候选策略放入可校准的大规模多智能体系统。当前版本提供规则驱动的场景预演，以及 Gemini、Claude 和 OpenAI 兼容模型的逐人物解释接口。速度与成本优势是产品目标，尚未发布对照基准。

## 一套工作台，三类决策

| | 产品 | 使用场景 |
| :---: | --- | --- |
| <img src="docs/assets/lab-growth.svg" width="70" alt=""> | **GrowthLab · 企业增长** | 引导流程、产品体验、激活与留存 |
| <img src="docs/assets/lab-merchant.svg" width="70" alt=""> | **BizLab · 商户经营** | 促销、人群响应、订单与贡献毛利 |
| <img src="docs/assets/lab-public.svg" width="70" alt=""> | **PolicyLab · 公共服务** | 网点、开放时段与居民可达性 |

### 构建情境 → 观察人物 → 比较策略 → 验证行动

- **12 张地图**：道路、建筑与设施配置；支持天气、时段和客流节奏。
- **可追踪人物**：观察画像、当前活动、目的地和行动路线，支持定位与跟随。
- **开放模型目录**：30 个示例型号、17 个模型家族或接入入口；支持名称搜索、提供商与本地／云端筛选，人群默认模型 + 单个人物覆盖。
- **清晰的对照**：统一周期、人群与预算，比较业务指标、资源边界与验证计划。
- **可交付研究**：保存与恢复场景；导出 HTML 报告、CSV 和打印版本。

## 🎬 产品演示

[**观看高清双语 Demo →**](https://kzczc.github.io/zhiyan-decision-studio/demo.html)

从一个商户促销问题开始，展示情境、人物、模型分配、方案比较与报告，再补充增长和公共服务场景。字幕使用中英双语，录制工具独立于网站。

[录制说明](DEMO-RECORDING.md) · [独立录制源码](demo/record.cjs)

## 快速开始

需要 **Node.js 20+**，运行时没有第三方依赖。

```bash
git clone https://github.com/Kzczc/zhiyan-decision-studio.git
cd zhiyan-decision-studio
npm start
```

访问 **http://127.0.0.1:61321/**。只查看静态网站也可运行：

```bash
python -m http.server 8000 --directory docs
```

## 多模型接入

1. 将 [models.example.json](models.example.json) 复制为自己的模型注册表，填写账户可用或本地已安装的**准确型号**。
2. 通过环境变量 `ZHIYAN_MODELS_FILE` 指定配置；云服务密钥仅设置在服务端环境中。
3. 启动服务器，在工作台“模型与接入”检查连接，然后为人群或选中人物分配型号。

| 连接器 | 服务 | 密钥环境变量 |
| --- | --- | --- |
| Gemini 原生协议 | Google Gemini | `GEMINI_API_KEY` |
| Messages 原生协议 | Anthropic Claude | `ANTHROPIC_API_KEY` |
| Chat Completions 兼容协议 | OpenAI、DeepSeek、Qwen、GLM、Kimi、MiniMax、豆包、Mistral、Grok | 注册表中配置 `keyEnv` |
| 本地兼容服务 | Llama、Qwen、DeepSeek-R1、Gemma、Phi、Granite；Ollama / vLLM / LM Studio | 按本地服务要求配置 |
| 聚合与自定义入口 | OpenRouter 或自建兼容服务 | 自定义 `baseUrl`、`model` 和 `keyEnv` |

目录可以持续扩展：在注册表中添加型号，重新检查连接即可，无需修改前端。版本、部署名与服务地址由自己的账户决定；占位条目须填写实际型号，并将 `requiresModelId` 改为 `false`。

示例型号用于说明配置方式，不保证账户权限或模型在线。配置就绪不等于调用成功；没有密钥时仍可使用本地规则。

[完整接口与配置说明 →](API.md)

## 能力与边界

| 已实现 | 尚需实际数据与验证 |
| --- | --- |
| 确定性业务测算、8–128 位场景样本 | 大规模 LLM 智能体联合仿真 |
| 三种提供商协议、逐人物模型解释 | 多智能体校准与真实性评估 |
| 模型路由、请求超时与错误反馈 | 相对真实试验的速度、成本基准 |

业务指标来自预设假设；敏感性设置改变可视化样本。模型解释单独展示，不直接改写业务指标。GitHub Pages 只托管前端，调用模型需运行本地网关。研究记录在浏览器保存；只有明确生成解释时，当前人物与策略会发送给选定提供商。

## 开发与复现

```bash
npm test
```

| 目录 | 内容 |
| --- | --- |
| `docs/` | 工作台、About、Demo 播放页及静态资源 |
| `server.cjs`、`lib/` | 本地静态服务与提供商协议适配器 |
| `models.example.json` | 可编辑模型注册表 |
| `tests/` | 协议、验证与错误路径测试 |
| `demo/` | 独立分镜、录制与字幕工具 |

<details>
<summary>素材、字体与致谢</summary>

图标来自 [Lucide](docs/assets/ICON-LICENSE.txt)，像素地形来自 [Kenney Tiny Town](docs/assets/pixel-town-license.txt)。
中文界面使用 Noto Sans SC / Noto Serif SC，英文数字使用 [Inter](docs/assets/INTER-LICENSE.txt)；字标保留[霞鹜文楷](docs/assets/WENKAI-LICENSE.txt)。
README 信息层级参考 [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) 与 [HKUDS/AI-Trader](https://github.com/HKUDS/AI-Trader)，无合作或从属关系。
项目名称与图形尚未完成商标核验。

</details>
