<div align="center">

<img src="docs/assets/logo-horizontal.svg" width="310" alt="ZHIYAN">

# ZHIYAN · Rehearse before you decide

**Faster exploration · Lower-cost iteration · Explainable decisions**

[中文](README.md) ｜ [**English**](README.en.md)

[🌐 Live workspace](https://kzczc.github.io/zhiyan-decision-studio/) · [🎬 Watch demo](https://kzczc.github.io/zhiyan-decision-studio/demo.html) · [Model gateway](API.md)

</div>

<a href="https://kzczc.github.io/zhiyan-decision-studio/demo.html"><img src="docs/assets/demo-cover.png" width="100%" alt="Watch the bilingual product demo"></a>

**ZHIYAN** brings candidate strategies, participant profiles and resource constraints into an observable city. Compare alternatives before a real-world pilot.

> Our goal is a calibrated, large-scale multi-agent simulation system. This release provides rule-based rehearsals and per-person explanations through Gemini, Claude and compatible models. Speed and cost benefits are design goals, not published benchmark results.

## Three labs

| Lab | Decisions |
| --- | --- |
| **GrowthLab** | Onboarding, activation and retention |
| **BizLab** | Promotions, customer response and contribution margin |
| **PolicyLab** | Service locations, opening hours and accessibility |

**Build a scenario → Observe people → Compare strategies → Validate in practice**

12 maps, participant tracking, group and individual model assignments, scenario snapshots, HTML/CSV reports, and responsive layouts.

## 🎬 Product demo

[**Watch the high-resolution bilingual demo →**](https://kzczc.github.io/zhiyan-decision-studio/demo.html)

A merchant promotion walkthrough, followed by growth and public-service examples. Recording code lives separately in [demo/record.cjs](demo/record.cjs).

## Quick start

Node.js 20+, no runtime dependencies.

```bash
git clone https://github.com/Kzczc/zhiyan-decision-studio.git
cd zhiyan-decision-studio
npm start
```

Open **http://127.0.0.1:61321/**. For static pages only, run `python -m http.server 8000 --directory docs`.

## Model routing

Configure your accessible model IDs in [models.example.json](models.example.json), point `ZHIYAN_MODELS_FILE` to the registry and set provider keys on the server.

- **Gemini**: native GenerateContent protocol; `GEMINI_API_KEY`.
- **Claude**: native Messages protocol; `ANTHROPIC_API_KEY`.
- **Compatible cloud APIs**: OpenAI, DeepSeek, Qwen, GLM, Kimi, MiniMax, Doubao, Mistral and Grok.
- **Local families**: Llama, Qwen, DeepSeek-R1, Gemma, Phi and Granite through Ollama, vLLM or LM Studio.
- **Aggregators and custom endpoints**: OpenRouter or your own Chat Completions service.

The editable catalogue includes **30 example entries across 17 families or gateways**. Search by name, filter by family and deployment, assign group defaults and override individual people. Add entries to the registry and reconnect without changing the frontend. Replace placeholder IDs and set `requiresModelId` to `false` before use.

Use the **AI 模型** card above the map to choose a group default, or assign each group separately. Connect the model service, select a map participant and open the model settings beside their profile to ask a question. Scene behavior preferences are separate rule settings. Example IDs are configuration samples, not availability guarantees. Configured does not mean a provider call has succeeded. Keys never enter the website.

[API and configuration →](API.md)

## Current scope

The release includes deterministic planning models, 8–128 visual participants, three provider adapters and per-person generated explanations. Large-scale LLM orchestration, calibration and speed/cost benchmarks remain future work.

Generated explanations do not change aggregate business metrics. GitHub Pages hosts the frontend; run the local gateway for model calls. Research stays in localStorage; an explicit explanation request sends the selected persona and scenario to the configured provider.

## Development

```bash
npm test
```

`docs/` contains the frontend; `lib/` the provider adapters; `tests/` protocol checks; `demo/` recording tools.

Typography: Noto Sans SC, Noto Serif SC and Inter. Icons: Lucide. Pixel terrain: Kenney Tiny Town (CC0). Licenses live in `docs/assets/`. README structure is inspired by HKUDS/LightRAG and HKUDS/AI-Trader; no affiliation is implied.
