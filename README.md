# 微信小游戏交付 Skill

> 把一个粗略的游戏想法，推进为可玩、可验证、可发布的原生微信小游戏。

这是一个面向 Codex 的完整交付 Skill，覆盖创意收敛、技术规划、原生工程搭建、功能开发、问题调试、性能优化、质量验收与发布准备。它适用于文字、休闲、动作、解谜、文化内容等多种游戏类型。

[查看 Skill 主入口](./SKILL.md) · [查看 QA 清单](./references/qa-checklist.md) · [查看发布指南](./references/publishing.md)

## 它能做什么

- 把模糊想法收敛成有范围、有验收标准的游戏方案
- 创建原生微信小游戏工程，优先采用轻量的 CommonJS 与 Canvas2D
- 实现核心玩法、触摸交互、场景状态、数据校验与多尺寸适配
- 定位微信开发者工具中的编译、加载、运行和资源问题
- 检查包体、图片、音频、帧率、内存与加载性能
- 覆盖正常、暂停、失败、恢复等关键游戏状态
- 区分静态、构建、运行、交互、视觉和真机性能证据
- 生成发布前检查项，但不把“代码存在”误报为“真机已经通过”

## 标准交付流程

```mermaid
flowchart LR
    A[创意收敛] --> B[方案与验收标准]
    B --> C[原生工程搭建]
    C --> D[核心玩法实现]
    D --> E[调试与性能优化]
    E --> F[QA 与真机验证]
    F --> G[发布准备]
```

Skill 会根据任务选择最窄的工作模式：

| 模式 | 适用情况 |
| --- | --- |
| Ideate | 只有想法或粗略提案，需要先补齐玩法与范围 |
| Plan | 需要技术方案、数据结构和验收标准 |
| Build | 新建或修改微信小游戏工程 |
| Debug | 复现并修复编译或运行问题 |
| Optimize | 优化性能、包体或体验 |
| QA | 只检查并报告问题，不自动修改 |
| Publish | 准备版本、隐私材料、发布说明和检查清单 |

## 安装

在 Codex 中直接输入：

```text
使用 $skill-installer 安装：
https://github.com/dandeshuitaleng-png/wechat-mini-game-delivery
```

也可以手动克隆到 Codex Skills 目录：

```bash
git clone https://github.com/dandeshuitaleng-png/wechat-mini-game-delivery.git \
  ~/.codex/skills/wechat-mini-game-delivery
```

安装完成后，在下一轮对话中调用：

```text
使用 $wechat-mini-game-delivery，把这个微信小游戏想法整理成可执行方案。
```

如果本地已经存在同名目录，请先比较或备份；安装器默认不会直接覆盖已有 Skill。

## 使用示例

```text
使用 $wechat-mini-game-delivery，帮我把“方言声音配对”优化成一个
3 分钟内能完整通关的微信小游戏 MVP，先出方案，不要写代码。
```

```text
使用 $wechat-mini-game-delivery，根据已经确认的方案创建一个独立的
原生微信小游戏工程，并在微信开发者工具中完成编译验证。
```

```text
使用 $wechat-mini-game-delivery，检查当前项目为什么在 Node 中正常，
但在微信开发者工具里读取关卡 JSON 失败，并修复这个问题。
```

## 仓库结构

| 路径 | 作用 |
| --- | --- |
| [`SKILL.md`](./SKILL.md) | Skill 主入口、任务路由与完整交付循环 |
| [`agents/openai.yaml`](./agents/openai.yaml) | Codex 中展示的名称、简介和默认提示词 |
| [`references/idea-refinement.md`](./references/idea-refinement.md) | 创意评分、收敛方法与方案模板 |
| [`references/game-types/`](./references/game-types/) | 文字、动作、休闲、解谜类游戏指南 |
| [`references/top-games/`](./references/top-games/) | 头部游戏的玩法、交互和视觉基线 |
| [`references/design-patterns/`](./references/design-patterns/) | UI、动效与视觉效果模式 |
| [`references/performance.md`](./references/performance.md) | 帧率、内存、加载与包体优化 |
| [`references/runtime-pitfalls.md`](./references/runtime-pitfalls.md) | 微信运行时与开发者工具常见问题 |
| [`references/qa-checklist.md`](./references/qa-checklist.md) | 功能、交互、视觉与真机 QA |
| [`references/publishing.md`](./references/publishing.md) | 发布配置、隐私合规和提审流程 |
| [`scripts/`](./scripts/) | 工程初始化与确定性检查脚本 |

## 内置脚本

在仓库根目录运行：

```bash
# 创建基础、Canvas2D 或分包模板
node scripts/init-project.js my-game --template canvas2d

# 检查包体、资源和常见性能风险
node scripts/check-performance.js /path/to/my-game

# 校验工程结构、配置与资源
node scripts/validate-assets.js /path/to/my-game

# 审核文字游戏关卡、路径和目标词
node scripts/audit-word-levels.js data/levels.json \
  --directions 8 \
  --expected-levels 30 \
  --strict
```

脚本需要本机已安装 Node.js。微信开发者工具、AppID、签名和真机环境仍需按具体项目配置。

## 验证边界

这个 Skill 会把证据分层报告：

1. **静态证据**：源码、配置、资源、类型与数据校验
2. **构建证据**：微信开发者工具实际编译结果
3. **运行证据**：模拟器或真机成功启动且无阻断错误
4. **交互证据**：真实点击、滑动、暂停、恢复和异常路径
5. **视觉证据**：当前版本在目标尺寸下的截图检查
6. **性能证据**：真机帧率、内存、加载时间和包体数据

Node.js 检查不能替代微信开发者工具编译，开发者工具编译也不能替代真机、交互或视觉验收。

## 适用边界

- 面向原生微信小游戏，不等同于微信小程序页面开发
- 可以生成方案、代码和检查报告，但不会绕过平台审核与隐私要求
- 外部开源项目只作为参考，使用前仍需确认许可证和素材授权
- 发布前应至少完成 iOS 与 Android 真机验证，并核对当前微信官方规则

## 开发验证

修改模板或检查脚本后运行：

```bash
node tests/smoke.cjs
```

该验证覆盖模板生成、已有目录保护、默认场景绘制、前后台循环恢复、资源计数和无效配置。场景与生命周期使用模拟微信 API，不能替代微信开发者工具或真机验证。

`check-performance.js` 统计源码体积预算，包含 JSON、字体等文件，排除 `.git`、`node_modules` 和项目工具配置；它尚未应用 `packOptions` 或编译转换，最终包体以开发者工具为准，也不测量帧率、内存或加载耗时。

## 多个 AI 协作完成游戏

新增 Collaborate 模式：策划规格 → 可玩原型与风格样板 → 外部 AI 生成素材 → 文件检查与人工审查 → 接入游戏 → 开发者工具与真机验证。

```text
使用 $wechat-mini-game-delivery，结合我已有的 AI 网站制作微信小游戏。
先按我的游戏想法生成策划交接包、美术和声音任务，列出素材规格与提示词。
用占位素材制作可玩原型；我下载生成素材后再检查、整合和验证。
```

第一版使用文件交接，不需要 API 密钥。示例与工具：

```bash
node scripts/ai-handoff.js init examples/quiz-handoff.json /tmp/quiz-handoff-v1
node scripts/ai-handoff.js check /tmp/quiz-handoff-v1/manifest.json /tmp/quiz-assets
node tests/ai-handoff.cjs
```

将素材放进 assets-root 下对应路径，填写清单中的来源、任务记录、使用条款及人工审查状态。工具检查路径、存在、体积及 PNG 文件头尺寸，并记录文件指纹；视觉、音频质量与微信运行仍需实际验收。

详见 [外部 AI 协作工作流](references/ai-collaboration.md)。官方 API 自动生成和网页自动操作尚未接入。

### 素材导入与回退

素材人工审查后，将检查报告的 SHA-256 填入 `reviewedSha256`。导入会核对审查指纹，阻止替换后的文件沿用旧审查。

```bash
# 预览导入计划
node scripts/ai-handoff.js import /tmp/quiz-handoff-v1/manifest.json /tmp/quiz-assets /path/to/game v1
# 导入独立版本，拒绝覆盖
node scripts/ai-handoff.js import /tmp/quiz-handoff-v1/manifest.json /tmp/quiz-assets /path/to/game v1 --apply
```

生成 `ai-assets/v1/index.js` 供游戏通过 CommonJS 引用，`receipt.json` 记录素材来源与版本。新版使用 v2，回退时切换代码引用到 v1；旧版本的包体需纳入发行检查。导入后继续验证加载回退、画面、声音与真实交互。
