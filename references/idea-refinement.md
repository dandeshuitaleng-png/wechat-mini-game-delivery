# Idea Refinement and Scoping

Turn a raw idea or rough proposal into a validated, scoped, buildable plan. Run this BEFORE the delivery loop whenever the input is an idea rather than a confirmed spec.

## Step 1: Restate and assume

- Inputs may be one sentence, a screenshot, a competitor's name, or half a page of notes.
- Restate the understanding in 2-3 sentences, list the assumptions made, and only ask the user when a wrong assumption would change the genre or the business model. Everything else: decide, note it, move on.

## Step 2: Score on five dimensions

Rate each dimension Strong / Workable / Weak. Any Weak must be fixed in Step 3, not ignored.

1. **Hook（玩法钩子）**: Can the core fun be said in one sentence? One-handed? Session under 5 minutes? Cross-check against the 通用设计公式 in the matching `references/top-games/` category file.
2. **Platform fit（平台契合）**: Mini games have no centralized traffic — growth comes from social spread. Does the idea have a share/rank/versus hook (地域排行, 求援分享, 炫耀成绩, 群排行)? Portrait one-hand play? Fragmented sessions?
3. **Feasibility（技术可行）**: Is 2D enough, or does the fun really need 3D? Does core content fit a 4MB main package (with subpackages for the rest)? Object counts on screen (1000+ 同屏 needs pooling + batching)? Canvas2D vs engine — see `references/external-resources.md` §2 for engine selection.
4. **Edge（差异化）**: Name the 2-3 closest titles in `references/top-games/`. What differs — theme, mechanic mix, art style, or loop hybrid? A pure clone is not a plan.
5. **Monetization（变现）**: IAA (rewarded video: revive / hint / double rewards) or IAP (skins / chests / battle pass)? Copy the structure from the closest benchmark instead of inventing one.

## Step 3: Repair moves (how weak ideas get fixed)

- **Cut scope**: MVP keeps only the core loop + ONE growth hook. Everything else goes to the non-goals list.
- **Map onto a proven skeleton** (each links to its category file for parameters):
  - 开箱循环 → `top-games/idle-rpg.md`（寻道大千/疯狂骑士团/灵魂序章）
  - 三消+装修双循环 → `top-games/match-sim-io.md`（梦幻花园）
  - 割草 Build 三选一 → `top-games/action-survival.md`（弹壳特攻队/吸血鬼幸存者）
  - 合成+经营双循环 → `top-games/puzzle-party-3d.md`（肥鹅健身房）
  - 7 格卡槽堆叠消除 → `top-games/classic-casual.md`（羊了个羊/抓大鹅/猪了个猪）
  Innovation goes into theme and presentation, not into unproven loop math.
- **Add the missing social hook**: regional leaderboards, friend assist, score flex cards, group PK.
- **Pull parameters from benchmarks**: session length, UI split ratios, 3-5 color palette, animation timings — cite the exact `top-games` entry each parameter comes from.
- **De-risk tech**: 3D → 2.5D fake perspective, realtime multiplayer → async ghost/share, UGC → curated presets, custom engine → Canvas2D or Cocos.

## Step 4: Emit the plan in this exact template

```markdown
## 一句话定位
[题材] + [玩法骨架] + [钩子]，对标 [游戏A] 的 [差异点] 版本。

## 核心循环
[30 秒内能讲完的循环：动作 → 反馈 → 奖励 → 下一次动机]

## 对标与差异化
- [游戏A]（references/top-games/<file>.md）：借 [什么]，改 [什么]
- [游戏B]：借 [什么]，避 [什么坑]

## 交互与视觉方向
- 手势：[单指 点按/长按/滑动/拖拽]，单手可玩
- UI 分区：[比例，如 上60%战斗+下40%功能]
- 色板：[3-5 个色值 + 用途]
- 动效：[关键反馈动画 + 时长参数]

## 成长 / 留存 / 变现
- 成长线：[一条主线]
- 留存钩子：[离线收益/图鉴/赛季 选一]
- 变现：[IAA 或 IAP 结构，照抄对标]

## MVP 范围与非目标
- 做：[核心循环 + 1 钩子]
- 不做：[明确列出]

## 技术方案
- 引擎/渲染：[Canvas2D / Cocos / three.js]
- 数据结构：[关卡/存档 schema 要点]
- 包体预算：主包 [X]MB + 分包 [Y]MB

## 验收标准（可观测）
- 60 FPS，加载 < 3s，主包 < 4MB
- 单局 [N] 分钟，首日目标 [可完成核心循环 N 次]
- 全部游戏状态可进可出（教学/对局/暂停/结算/设置）
```

## Red flags — rewrite or reject outright

- Needs a long tutorial before the first fun moment (violates the 3-second rule).
- Realtime multiplayer as the MVP core — replace with async/share mechanics for v1.
- Core content cannot fit 4MB main package even after subpackaging.
- Forced sharing, share-to-unlock-core-gameplay, gambling, or cash-out mechanics — platform violations (see `references/external-resources.md` §1).
- Pure clone of a `top-games` title with no differentiator.

## Handoff

- After the user confirms the plan, enter "Execute the delivery loop" at Phase 1.
- Carry the plan's 验收标准 forward — Phase 5 checks against exactly those numbers.
- If the idea changes mid-build, re-run this file's Step 2 on the delta before touching code.

## Worked example (dogfooding the template)

Input: 「做个猫咪合成游戏」

## 一句话定位
猫咪题材 + 合成+经营双循环 + 猫图鉴收集，对标《肥鹅健身房》的「萌猫版合成装修」。

## 核心循环
拖拽两只相同猫合成更高级猫 → 交付订单得小鱼干 → 解锁/装修猫窝区域 → 吸引更稀有猫入住。

## 对标与差异化
- 肥鹅健身房（puzzle-party-3d.md #10）：借「合成+经营双循环、任务线 5-6 条随机刷新」，改「健身题材→猫咪题材，发射器→猫薄荷盆栽」。
- 动物餐厅（match-sim-io.md #4）：借「小鱼干单一货币、猫咪员工 idle 小动作、信件碎片化叙事」，避「纯放置无操作深度的坑——合成提供主动操作」。

## 交互与视觉方向
- 手势：单指拖拽合成 + 点按交付订单，单手可玩。
- UI 分区：左侧 55% 合成棋盘 + 右侧 45% 猫窝场景（参照肥鹅双区布局）。
- 色板：奶油白 #FDFEFE 底、鹅黄 #FFD966 主按钮、薄荷绿 #A9DFBF 辅助、珊瑚粉点缀（约 #FFB6C1）。
- 动效：合成弹跳光效约 300ms，新猫入住特写 1s，idle 猫舔毛/打滚小动作。

## 成长 / 留存 / 变现
- 成长线：猫窝区域解锁（客厅→花园→天台）。
- 留存钩子：猫图鉴收集 + 离线收益上限 4h。
- 变现：IAA——激励视频加速订单刷新 / 双倍小鱼干（照抄肥鹅结构）。

## MVP 范围与非目标
- 做：合成棋盘 + 1 个猫窝区域 + 20 只猫图鉴 + 离线收益。
- 不做：猫咪社交、访客系统、第二区域以后的内容、任何 3D。

## 技术方案
- 引擎/渲染：Canvas2D 原生，无引擎依赖。
- 数据结构：cats.json（等级/形象/稀有度）、orders.json、存档走版本化 localStorage。
- 包体预算：主包 2MB（20 只猫 WebP 立绘 + 1 场景）+ 无需分包。

## 验收标准（可观测）
- 60 FPS，加载 < 3s，主包 < 4MB。
- 单次会话 3-5 分钟，首日可完成 5 次合成订单。
- 全部游戏状态可进可出（教学/合成/装修/图鉴/设置）。
