# 外部资源清单（官方规范 / 引擎 / 开源项目 / 素材站）

> 2026-07 调研，所有 URL 均经联网验证可达。引用第三方代码或素材前，先核对其 LICENSE。

## 1. 微信官方规范关键要点

- **包体限制**：主包 ≤4MB；单个分包 ≤4MB；官方总上限最高 30MB（满足平台条件的游戏）。本 skill 的性能目标更严格——主包 <4MB、总包 <20MB（见 `references/performance.md`），为的是保加载体验，与官方上限不冲突。
- **启动加载**：主包资源全量加载后才启动；首包只放必要内容，其余走分包（`wx.loadSubpackage`）或 CDN 远程加载；iOS 可开「高性能模式」。
- **分享/排行榜**：自定义转发图需 MP 平台审核（imageUrlId）；禁止强制分享、利益诱导分享（运营规范 5.1）。好友/群排行只能在开放数据域内调 `wx.getFriendCloudStorage`，经 sharedCanvas 绘制，主域与开放数据域代码隔离、单向通信。
- **广告合规**：流量主有开通门槛（累计 UV>500）；激励视频须用户主动触发、完整播放后才发奖；禁止强制点击、诱骗点击、遮挡广告位、单屏两个及以上 banner。

**官方文档 URL**
- 分包加载：https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage/useSubPackage
- 转发分享：https://developers.weixin.qq.com/minigame/dev/guide/open-ability/share/share
- 开放数据域：https://developers.weixin.qq.com/minigame/dev/guide/open-ability/open-data.html
- 广告组件：https://developers.weixin.qq.com/minigame/dev/guide/open-ability/ad/ad.html
- 流量主运营规范：https://ad.weixin.qq.com/docs/239
- 平台运营规范：https://developers.weixin.qq.com/miniprogram/product/index.html

## 2. 引擎与 3D 方案选型

官方引擎适配总览：https://developers.weixin.qq.com/minigame/dev/guide/game-engine/engine-overview

- **Cocos Creator**：官方内置一键发布；引擎插件随客户端下发、不占 4MB 包体；自带远程资源缓存与 md5Cache 版本管理。发布文档：https://docs.cocos.com/creator3d/1.0/manual/zh/editor/publish/publish-wechatgame.html
- **LayaAir**：官方内置适配；引擎运行时计入自有包体，重度 3D 项目盯紧包体。
- **Unity / 团结引擎**：Unity 走官方 WebGL→小游戏转换 SDK（WebAssembly）；团结引擎（Unity 中国）把小游戏作为一等导出平台。包体大，需裁剪+代码拆分+资源进分包。
- **three.js / PixiJS**：经 weapp-adapter 打桩 DOM/Canvas 后运行（PixiJS 在 Android WebGL stencil 有已知坑），适配工作自担。

**一句话选型**：原生新项目优先 Cocos Creator；移植存量 Unity 项目用转换 SDK，长期押注国内选团结引擎；轻量/包体敏感或已有 Web 代码选 three.js/PixiJS + adapter。

## 3. 可复用开源项目

| 项目 | URL | 许可 | 价值 |
|---|---|---|---|
| wechat-miniprogram/minigame-demo | https://github.com/wechat-miniprogram/minigame-demo | 无 LICENSE，**许可待确认** | 官方 API/组件/云开发示例合集，含广告、开放数据域、Worker、PixiJS 示例，仅作学习参考 |
| wechat-miniprogram/minigame-canvas-engine | https://github.com/wechat-miniprogram/minigame-canvas-engine | MIT | 官方轻量 canvas2d 渲染引擎，好友排行榜/开放数据域推荐方案 |
| finscn/weapp-adapter | https://github.com/finscn/weapp-adapter | MIT | 经典浏览器 API 适配层，让 three.js/PixiJS 跑在小游戏；2019 年停更，作适配原理参考 |
| cocos/cocos-example-projects | https://github.com/cocos/cocos-example-projects | 根目录未见 LICENSE，**许可待确认** | Cocos 官方示例集（3D 物理、npm 集成），可直接构建验证发布流程 |

**使用原则**：开源项目只通过 URL 引用、按需克隆到目标项目侧，不复制进本 skill 目录（避免包体膨胀、许可污染、版本过期三重风险）。

## 4. 免费可商用素材站

| 站点 | URL | 素材类型 | 许可与注意 |
|---|---|---|---|
| Kenney | https://kenney.nl | 2D/3D/UI/音频，风格统一 | CC0 公有领域，可商用无需署名，原型首选 |
| Quaternius | https://quaternius.com | 低多边形 3D 模型与动画（带骨骼） | CC0 可商用，以各包页面标注为准 |
| OpenGameArt | https://opengameart.org | 美术/音乐/音效社区库 | 许可混杂（CC0/CC-BY/CC-BY-SA/OGA-BY），**逐素材核对**：CC-BY 需署名，SA 衍生需同许可共享 |
| itch.io 免费素材区 | https://itch.io/game-assets/free | 像素/手绘素材包 | 许可由作者自定，商用前必须逐包查看 |
| Game-icons.net | https://game-icons.net | 4000+ SVG 游戏图标 | CC-BY 3.0 **需署名**，支持在线改色导出 |
