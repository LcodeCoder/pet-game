# 绒绒乐园

绒绒乐园（Rongrong Paradise）是一个面向真实小猫爪子触控的柔和逗猫 HTML5 Canvas 小游戏原型。当前版本优先保证浏览器本地可运行、可测试，后续可迁移到 Cocos Creator 3.8 与抖音小游戏环境。

## 项目特点

- 全屏响应式 Canvas 游戏区域，适配横屏和移动端触控。
- 暖色、低刺激、毛绒风视觉，避免大面积深色、高频闪烁和尖锐音效。
- 多种逗猫玩具/模式轮换，包括激光点、小虫、鱼、羽毛、老鼠洞、窗影等代表玩法。
- 防重复模式轮换与偏好权重，让小猫持续保持新鲜感。
- 扩大的触碰判定半径，更适合猫爪、多点触碰和轻拍屏幕。
- 命中反馈、柔和 WebAudio 音效、休息提示和游玩结算。
- 首页、暂停、结算、历史记录和基础设置页。
- 抖音登录、广告与存储能力保留 Mock/占位边界，核心玩法不依赖外部 SDK。
- 无第三方运行依赖。

## 本地运行

需要 Node.js 18 或更高版本。

```bash
npm run dev
```

启动后打开：

```text
http://localhost:5173
```

## 验证

```bash
npm test
npm run smoke
```

## 操作说明

- 点击或触摸移动玩具可以得分。
- 首页点击「开启逗猫」开始一局。
- 游戏中可暂停、返回首页、查看历史记录或打开设置。
- 设置中可调整音乐音量、玩具移动速度和默认倒计时时长。
- 游戏结束后展示本次得分、触碰次数、历史最高分和游玩时长。

## 项目结构

```text
.
├── index.html              # 单页游戏入口与页面结构
├── scripts/                # 本地开发服务器与 smoke 检查
├── src/
│   ├── core/               # 游戏主循环、模式目录、轮换策略
│   ├── data/               # 本地游戏数据与记录
│   ├── gameplay/           # 玩具生成、吸引力表现、触碰判定
│   ├── services/           # 音频、存储、广告、登录、性能等服务边界
│   ├── ui/                 # HUD 与界面更新逻辑
│   ├── utils/              # 数学与随机工具
│   ├── main.js             # 页面编排与运行时入口
│   └── styles.css          # 软萌猫咪风界面样式
└── tests/                  # Node test 测试
```

## 抖音小游戏集成 TODO

以下能力已通过服务层隔离，当前实现以本地占位为主：

- `src/services/AuthService.js`
- `src/services/AdManager.js`
- `src/services/StorageService.js`

后续接入抖音小游戏时可替换为：

- `tt.login`
- `tt.createRewardedVideoAd`
- `tt.createInterstitialAd`
- `tt.createBannerAd`
- `tt.getStorage`
- `tt.setStorage`

即使登录、广告或存储 SDK 不可用，核心逗猫玩法也应保持可玩。

## Cocos Creator 迁移 TODO

当前版本是用于快速验证玩法和视觉方向的浏览器原型。后续 Cocos Creator 3.8 迁移可沿用这些模块边界：

- `GameMain`
- `RotationDirector`
- `AnimalSpawner`
- `TouchCollider`
- `AttractionDirector`
- `GameData`
- `AdManager`
- `AudioManager`

迁移时需继续保持低刺激视觉、柔和音效、扩大的猫爪触控热区和核心玩法免费可用。
