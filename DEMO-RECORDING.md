# 智演 Demo · 独立录制工程

[中文 README](README.md) · [English](README.en.md) · [在线观看](https://kzczc.github.io/zhiyan-decision-studio/demo.html)

## 叙事

问题 → 情境与人物 → 模型路由 → 策略对照 → 真实验证。

每个镜头包含一个动作和可见结果。中文主字幕为 32 px、英文为 22 px，放在画面外的固定字幕区域，避免遮挡操作。型号分配显示真实配置状态，未调用模型时不显示伪造的生成结果。

当前成片：1920 × 1080，1 分 58 秒，19 个镜头，H.264 MP4，约 22 MB。画面内嵌中英字幕；VTT 单独提供。影片无配音。

## 分镜

| 章节 | 内容 |
| --- | --- |
| 引入 | 一个方案上线前，会改变谁？ |
| 情境 | 地图、客流、设施与可观察路径 |
| 人物 | 画像、目的地、定位与跟随 |
| 技术 | 云端与本地模型目录、型号搜索；分群默认与人物覆盖 |
| 对照 | 会员策略、自定义方案、三项指标 |
| 交付 | 解读、资源边界与报告 |
| 扩展 | PolicyLab 与 GrowthLab |
| 展望 | 大规模多智能体目标；真实试点验证 |

## 复现

Node.js 20+。另行安装 Playwright 并配置浏览器：
```bash
npm install --no-save playwright
npx playwright install chromium ffmpeg
npm start
# 另一个终端
node demo/record.cjs --check
node demo/record.cjs
```

可选环境变量：
- `ZHIYAN_URL`：本地工作台根地址，默认 http://127.0.0.1:61321/。
- `PLAYWRIGHT_MODULE`：自定义 Playwright 包路径。
- `BROWSER_PATH`：已有 Chromium / Edge 路径。
- `FFMPEG_PATH`：用于转码 H.264 MP4 的完整 FFmpeg 可执行文件。

`demo/output/` 保存原始 WebM、逐章截图和 JSON；`docs/media/` 保存发布 MP4、VTT。快速检查模式不录制视频。网页片头与字幕层仅存在于独立录制页面，不注入产品源码。当前版本没有配音，也没有使用 Blender 渲染。

## 字幕与声明

“更快、更省、更可解释”作为设计目标表达；不得附加未经测试的倍数或真实客户案例。规则场景样本、逐人物模型解释、未来大规模多智能体仿真应分开说明。人物对话不代表真实用户意见。
