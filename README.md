# 小岛帝国（Isle Empires）

Q 版休闲塔防 RTS：采集资源 → 建造经营 → 大地图 A* 攻防 → 城墙封隘 → 波次守城。

▶ **在线试玩**：https://liyu2066140-cell.github.io/cuddly-bassoon/

## 技术路线（三阶段）

| 阶段 | 形态 | 状态 |
|---|---|---|
| M2 玩法灰盒 | HTML5 单文件（1 天验证核心循环） | ✅ 已完成 |
| **M4 工程化** | **ES Modules 模块化工程（当前仓库结构）** | ✅ **当前阶段** |
| M5 平台化 | Cocos Creator 导出抖音/微信小游戏包 | 规划中 |

> 灰盒的作用是用最小成本验证"游戏好不好玩"；玩法成立后进入工程化，再上引擎出小游戏包。HTML5 系（Cocos/Laya）正是抖音、微信小游戏的原生技术栈。

## 工程结构

```
├─ index.html              入口（薄壳，加载 main.js）
├─ package.json            工程清单（type: module）
├─ game.json               场景/显示配置
├─ scripts/
│  ├─ main.js              启动器 + 主循环 + 事件绑定
│  ├─ core/                引擎核心
│  │  ├─ config.js         数值表（兵种/建筑/时代/波次）
│  │  ├─ state.js          全局状态仓（G）
│  │  ├─ canvas.js         画布与 DPR
│  │  ├─ assets.js         素材加载 + 两步烘焙锐化
│  │  ├─ pathfinding.js    网格 + A* 寻路 + 道路 cost
│  │  ├─ audio.js          WebAudio 合成音效（17 种，零素材）
│  │  ├─ settings.js       设置持久化
│  │  ├─ dom.js / utils.js
│  ├─ entities/entities.js 单位/敌人/建筑工厂
│  ├─ systems/
│  │  ├─ combat.js         攻击表现/索敌/击杀/技能
│  │  ├─ economy.js        一键采集/放置建造
│  │  ├─ input.js          框选/拖拽/摄像机/放置模式
│  │  └─ fx.js             粒子
│  ├─ render/
│  │  ├─ render.js         主渲染（阴影/血条/飘字/粒子）
│  │  └─ terrain.js        地形离屏层（河/桥/山/道路/沙沿/暗角）
│  ├─ scenes/levels.js     关卡定义（1-1 / 1-2 / 1-3）
│  └─ ui/ui.js             HUD/横幅/引导/设置
├─ assets/                 游戏素材（AI 生成透明 PNG）
├─ 素材定稿/               全套定稿素材
└─ docs/                   策划案
```

## 系统特性

- **大地图 + 摄像机**：1536×1024 世界，右键拖拽/方向键漫游
- **地形与攻防**：河流纵贯、石桥隘口、山体屏障；敌军 A* 沿道路进攻，**城墙封桥逼敌拆墙**
- **寻路普及**：我方单位/采集/敌军进攻全部 A*（道路格 cost 0.6）
- **放置模式**：建筑自选位置、网格吸附、合法性着色
- **打击感**：震屏/突刺/挥砍弧光/受击闪白/粒子/击杀音
- **音效**：WebAudio 全合成 17 种，零素材文件

## 关卡

- 1-1 荒岛安家（教学：采集/建造/清狼）
- 1-2 月夜突袭（守桥：三波教徒沿路进攻）
- 1-3 峡谷会战（四波强敌+教徒头目，双线防守）

## 开发

```bash
npx serve .        # 本地预览
git push           # 推送后 GitHub Pages 自动更新
```
