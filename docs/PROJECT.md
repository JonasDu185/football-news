# 足球新闻（football-news）— 项目说明

> 本文档按 2026-11-07 的**代码 + 线上实际状态**重写，是这个项目的"正本"。
> 以前的 `CLAUDE.md` 视觉部分、`docs/design/ui-redesign-direction.md`、`design-qa.md` 有多处已过时，见文末「文档索引」。

## 一句话是什么
一个装在手机主屏幕上的体育新闻 App（PWA）：服务器每 30 分钟从直播吧抓新闻，按「足球 / 综合 / 篮球 / 热点」四个频道展示，点开能用干净的阅读模式看正文。

## 给谁用
JD 自己每天刷体育新闻用（个人项目，暂不对外推广）。

## 现在的状态
| 项目 | 情况 |
|---|---|
| 线上地址 | https://jdvibecoding.site/football/ （域名已启用，HTTPS 正常；IP 地址 101.42.29.156 也能访问） |
| 服务器 | 腾讯云轻量 Lighthouse，Ubuntu，`/opt/football-news`，PM2 进程名 `football-news`，端口 3001 |
| 线上版本 | `9d2d5c1`（2026-10-14 合并「多体育分类 Tab」），为当前线上代码；本次文档整理不部署线上 |
| 最后代码更新 | 2026-10-14 |
| GitHub | JonasDu185/football-news（公开） |

**已完成**
- 四个频道：足球 / 综合 / 篮球 / 热点（左右滑动或点 Tab 切换）。
- 足球、综合、篮球：双列瀑布流，智能混排（时间 + 偏好 + 热度 + 已读下沉 + 同源打散）。
- 热点：不分项目按热度排，"一条头条 + 两条次头条 + 后续列表"的编辑版式。
- 阅读模式（服务器替你扒正文、清理后显示）、阅读进度条。
- 搜索、稍后阅读（收藏）、偏好设置（关注的联赛/球队）、亮/暗/跟随系统主题、下拉刷新、无限滚动、回到顶部。
- PWA：可添加到主屏幕（iOS / 安卓图标已修好）。

**没完成 / 关着的**
- **分享功能已写好但关着**：服务器 `/api/config` 返回 `enableShare:false`。打开方法：在服务器 `ecosystem.config.cjs` 里取消 `ENABLE_SHARE: 'true'` 的注释，然后 `pm2 restart football-news --update-env`。本轮未批准打开，必须另获 JD 确认。
  - 打开后：阅读页右上角出现「分享」按钮 → 手机弹出系统分享面板（不支持时复制链接）→ 分享出去的是链接 `https://jdvibecoding.site/football/share?url=...`，别人点开是一张服务器生成的干净文章页（标题 + 正文，顶部写"足球新闻"）。
  - 想要的「漂亮分享海报（大图+标题+摘要+二维码）」**还没做**。微信里的自定义链接卡片需要认证公众号 + JS-SDK，目前不具备。
- **视频看不了**：带视频的文章只显示「📺 本文包含视频内容 · 在浏览器中打开查看」。原因见「关键经验」。
- Tab 拖动排序：暂缓。
- 已知小瑕疵：个别足球比赛新闻（如"利物浦 vs 曼城"）被分到「综合」，因为直播吧给的 type 不是 `zuqiu`；当时决定不改。
- 2026-11-07 截图时看到：首页有几张图是灰块；在窄窗口切到「足球」时冒出篮球新闻、右侧露出半个「热点」页。**未在手机上复现确认**，待查。

## 当前设计（以代码为准）
来源：`src/index.css`（注释写的是「足球志 · 先锋杂志浅色/深色主题」）、`src/App.tsx`、`src/components/ChannelNav.tsx`。

- **整体**：浅色杂志风，暖白纸感底 + 黑色衬线标题 + **蓝色**强调色；有完整深色主题，默认跟随系统。
- **浅色色板**：背景 `#F6F4EF`，文字 `#111216`，次要文字 `#716F69`，分割线 `#D7D3CA`，强调蓝 `#1647E8`，热点面板底 `#F0EEE8`。
- **深色色板**：背景 `#080A0E`，文字 `#F1EEE7`，强调蓝 `#4C70FF`。
- **字体**：标题用中文衬线 `Noto Serif SC → Songti SC → Source Han Serif SC → STSong`；正文/功能文字 `Geist Variable → Inter → PingFang SC`。
- **圆角**：`--radius: 0.125rem`（2px），几乎直角。
- **顶部**：没有大头部了（2026-07-27 移除日期票根大头部），只有一条 48px 导航：左「菜单」、中间 4 个频道、右「搜索」。当前频道 = 蓝色加粗文字 + 2px 蓝色下划线。
- **菜单（侧滑抽屉）**：主题（跟随系统/深色/浅色）、稍后阅读、偏好设置。
- **卡片**：不套卡片壳、无阴影，靠留白分隔；已读新闻标题变淡、图片降饱和（热点频道除外的规则以代码为准）。

## 技术栈
- 前端：React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + shadcn/ui（base-ui），lucide 图标
- 后端：Express 5（用 `tsx` 直接跑 TypeScript）+ SQLite（better-sqlite3，库文件 `data/news.db`）
- 正文提取：@mozilla/readability + JSDOM + DOMPurify
- 定时任务：node-cron —— 每 30 分钟抓取；每天 03:00 清理 7 天前数据
- 测试：Vitest（约 73 个用例）；Lint：oxlint
- 数据源：直播吧 `http://m.zhibo8.com/json/hot/24hours.htm`（唯一可用接口，只有 zuqiu / nba / other 三类）

**主要接口**（`src/server/index.ts`）：`/api/news/featured`、`/api/news/by-category?category=football|basketball|other`、`/api/news/hot`、`POST /api/news/refresh`、`/api/news/article?url=`、`/api/config`、`/share?url=`（仅 ENABLE_SHARE=true 时注册）。

## 怎么运行与部署
```bash
npm install
npm run dev      # 本地开发：前端 Vite + 后端 3001 同时起
npm test         # 跑测试
npm run build    # 生产构建（tsc + vite）
```
**部署（当前真实做法，2026-10-14 用的就是这个）**：服务器上的 `/opt/football-news` 是一个 git 仓库（origin = GitHub）。
```bash
git push origin main                       # Mac 上先推到 GitHub
ssh football-news
cd /opt/football-news && git pull && npm install && npm run build && pm2 restart football-news
```
- nginx 配置：`/etc/nginx/sites-enabled/football-news`，`/football/` → `127.0.0.1:3001`，`/ai-news/` → `127.0.0.1:3002`，Let's Encrypt 证书。
- 注意：`scripts/deploy.sh`（rsync 方式）和 CLAUDE.md 里的 scp 命令是**旧做法**，现在不用。
- `vite.config.ts` 里 `base: '/football/'`，所有前端路径都挂在 `/football/` 下。

**测试版 / 正式版**：目前只有正式版。建议以后在同一台服务器再跑一份测试版（例如端口 3011 + `/football-test/` 或子域名），跟 `test` 分支走，正式版不动。

## 已知问题与待办
1. 分享开关保持关闭；只有另获 JD 批准后才打开。
2. 做分享海报（大图 + 标题 + 摘要 + 二维码，可存图发微信/朋友圈）。
3. 视频：研究能否在 App 内播放（需要拿到腾讯云点播的真实地址），做不到就美化提示。
4. 排查首页灰块图片、窄屏切频道串页的问题。
5. 分类漏判（比赛新闻进了「综合」）——可在 `classifyCategory` 加标题关键词兜底。
6. 清理死代码：`DateHeader.tsx` 等旧头部组件已不再被 App 使用。
7. 2026-11-07（北京时间）已把 nginx 备份移至 `/root/nginx-backups/football-news.ai-news-backup-20260729`；`nginx -t` 通过后 reload，两站均返回 200，重复域名警告消失。
8. 服务器 PM2 重启计数 135 次，error.log 里有 serve-static 报错（2026-11-04），可抽空看一下原因。
9. 建测试环境（见上）。

## 关键经验（保留自旧 CLAUDE.md 和工作日志）
**数据源**
- 直播吧字段：`lable`（不是 tag）、`type: 'zuqiu' | 'nba' | 'other'`、`thumbnail`、`shortTitle`、`from_url`（外媒原文）、`url`（直播吧文章页）、`count`（热度值）。
- `from_name` 常缺失，从 `from_url` 域名推断来源名（`src/lib/newsFilter.ts` 的 `guessSourceName`）。
- 时间是北京时间字符串；用 `toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })` 生成 cutoff，别手动 +8。

**图片三个坑**
1. HTTPS 页面里的 HTTP 图片会被拦 → 统一替换成 `https://`。
2. CDN 防盗链 → `<img referrerPolicy="no-referrer">`。
3. `_thumb.jpg` 太小 → 去掉 `_thumb` 用原图。

**阅读模式**
- Readability 会丢掉 `<video>`；直播吧视频是 JS 动态加载（腾讯云点播），JSDOM 不跑 JS 拿不到地址 → 目前只能显示提示。

**SQLite 迁移**
- `CREATE TABLE IF NOT EXISTS` 不会给旧表加列；新列要 `PRAGMA table_info` 检测后 `ALTER TABLE`，相关索引要在 ALTER 之后再建，否则报 "no such column"。

**部署**
- 生产环境装依赖后必须 `npm run build`；PM2 端口是 **3001**（不是 3000）。
- 国内服务器拉 GitHub 偶尔慢/抽风，重试即可；Mac 推送时 Clash 代理抽风也会导致失败。

**前端布局/动画（踩坑血泪）**
- 轮播面板别用 CSS 百分比做偏移：用 `ResizeObserver` 量容器像素宽度，用像素 `translateX`。
- 切页动画：先 `setEnableTransition(true)` 再 `setActiveTab`，两者在同一次渲染生效。
- 滚动驱动的动画直接操作 DOM + `requestAnimationFrame`，不要走 React state，否则闪烁死循环。
- 看起来"不动"的东西（导航、Tab）在 DOM 里就让它真的不动；只有新闻内容随轮播滑动。
- 容器内等分定位用 `left: calc(N * 100% / k)`，不要用 `translateX(%)`（相对自身宽度）。
- 阅读页滚动容器是 fixed 覆盖层，进度条要监听容器的 scrollTop，不是 window。

**智能混排公式**（`src/lib/feedRanker.ts`）
`score = 2^(-hours/6) + 偏好命中(≤3)×0.35 + log10(count+1)/7×0.2 − 已读0.35`，同源最多连续 2 条。

## 分支
- `main`：正式版（线上就是它）。
- `ui/magazine-light-dark`、`feature/multi-sport-tabs`：已验证完整合并进 main，2026-11-07（北京时间）删除本地与 GitHub 远程分支。

## 文档索引

- `docs/PROJECT.md`：当前目标、设计与现状唯一正本。
- `CLAUDE.md`：AI 工作入口与约定，先读本正本。
- `README.md`：中文简介。
- `docs/design/ui-redesign-direction.md` 与配套参考图：已过时、未采用。
- `docs/archive/design-qa-2026-07-27.md`：已过时的大头部验收记录。
- `scripts/deploy.sh`：保留的旧 rsync 脚本，当前不用；实际部署见上文服务器 git pull。
