# Football News — 足球新闻聚合 PWA

## 项目概览

- **线上地址**: `https://101.42.29.156/football/`
- **域名**: `jdvibecoding.site`（待 ICP 备案）
- **服务器**: 腾讯云轻量 Lighthouse · Ubuntu · IP 101.42.29.156
- **SSH**: `ssh football-news`（已配密钥）
- **PM2**: `pm2 status` 查看进程，`pm2 restart football-news` 重启
- **GitHub**: `https://github.com/JonasDu185/football-news`

## 技术栈

- 前端: React 19 + TypeScript + Vite + shadcn/ui + Tailwind CSS v4
- 后端: Express 5 + SQLite (better-sqlite3)
- 文章提取: @mozilla/readability + JSDOM + DOMPurify
- 定时任务: node-cron（每 30 分钟抓取，每天凌晨 3 点清理 7 天前数据）
- 测试: Vitest（31 个测试）
- 部署: scp 推送 + PM2 进程管理

## 常用命令

```bash
npm run dev          # 开发（前后端同时启动）
npm test             # 31 个测试
npm run build        # 生产构建
ssh football-news    # SSH 登录
# 部署：
npm run build && scp -r dist/ src/ football-news:/opt/football-news/ && ssh football-news "cd /opt/football-news && npm run build && pm2 restart football-news"
```

## 关键经验

### 图片显示问题的三个坑
1. **HTTP 混合内容**: 页面 HTTPS 但缩略图 HTTP → Chrome/Safari 拦截不显示。修复：`replace(/^http:\/\//, 'https://')`
2. **CDN 防盗链**: tu.duoduocdn.com 检查 Referer，非 zhibo8 域名返回 403。修复：`referrerPolicy="no-referrer"`
3. **缩略图太小**: 直播吧 `_thumb.jpg` 只有 15KB。修复：`replace(/_thumb(?=\.\w+$)/, '')` 换原图（638KB）

### 直播吧 API 字段名
- `lable` 不是 `tag`，`type: 'zuqiu'` 不是 `'足球'`
- `thumbnail` 不是 `thumb`，`shortTitle` 有精简标题
- `from_url` 是外媒原文链接，`url` 是直播吧自己的文章页
- `count` 是热度值（6000099 级别），用于近期热点排序

### 时区
- 直播吧数据是北京时间字符串（`YYYY-MM-DD HH:mm:ss`）
- 用 `toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' })` 生成 cutoff
- 不要手动 UTC+8 换算，容易出错

### 阅读模式限制
- Readability 会丢弃 `<video>` 标签
- 直播吧视频是 JS 动态加载的（腾讯云点播），JSDOM 不跑 JS 拿不到 src
- 目前显示"📺 本文包含视频内容"提示

### 部署
- 腾讯云国内服务器拉 GitHub 很慢，用 scp 从本地直传
- 域名必须 ICP 备案才能在国内服务器用
- nginx 做 SSL 终止（Let's Encrypt certbot），Express 跑 HTTP 3001
- 生产环境 `npm install` 后必须 `npm run build`（`jsdom` 在 deps 不在 devDeps）

### 源名推断
- `from_name` 经常缺失，从 `from_url` 域名推断来源名
- 映射表在 `src/lib/newsFilter.ts` 的 `guessSourceName` 函数
- 知名域名（x.com→Twitter, mirror.co.uk→镜报 等）

### Flex + 百分比宽度的循环依赖陷阱
- **根因**: flex 容器内子元素设 `width: 100%`，但 flex 容器自身宽度由子元素撑开 → 循环依赖。浏览器解析 `100%` 时行为不一致，子元素宽度可能远小于预期。
- **表现**: Carousel 三页横排，`translateX(-33.333%)` 偏移量不够，第 2、3 页内容显示不全或完全不可见。
- **教训**: Carousel / 面板切换场景，**不要用 CSS 百分比做偏移**。用 `ResizeObserver` 测量容器像素宽度，全部用 `translateX(-N * viewportWidth + swipeOffset)px` 像素计算，面板设显式 `style={{ width: viewportWidth }}`。
- **通用规则**: 任何需要"子元素宽度 = 父元素宽度 × N"的场景，如果父子宽度互相依赖，一律用 JS 测量 + 像素赋值。

### Carousel 页面切换动画的时序陷阱
- **根因**: React 事件处理器中先 `setActiveTab` 再在 `useEffect` 里 `setEnableTransition(true)`。状态更新批量合并后，第一帧渲染时 activeIndex 已变但 transition 还是 `none`，track 瞬间跳到新位置。useEffect 再开过渡已无意义。
- **教训**: 点击切页时，**先设 `setEnableTransition(true)`，再改 `setActiveTab`**。React 18 在事件处理器中批量合并状态，一次渲染同时生效 → 动画正常。

## 项目结构

```
src/
  lib/newsFilter.ts        # 数据过滤、排序、字段标准化、源名推断
  server/
    index.ts               # Express API + 定时任务
    fetcher.ts             # 直播吧 JSON 抓取
    storage.ts             # SQLite CRUD + 清理
    reader.ts              # 文章正文提取（Readability）
  components/
    NewsCard.tsx           # 新闻卡片（支持 compact 瀑布流模式）
    NewsList.tsx           # 新闻列表（支持 columns=2 瀑布流双列）
    DateHeader.tsx         # 日期顶栏
    ReaderView.tsx         # 阅读模式视图
    PullToRefresh.tsx      # 下拉刷新（支持自定义 scrollContainerRef）
    LoadMoreSentinel.tsx   # 无限滚动哨兵（支持自定义 IntersectionObserver root）
    ui/                    # shadcn 组件
  hooks/useNews.ts         # 前端数据加载
  App.tsx                  # 主页面：三标签 Carousel（世界杯|每日消息|近期热点）
                           #   布局 h-dvh flex-col → 固定头部 + 面板独立 overflow-y:auto
                           #   三页始终挂载横排，ResizeObserver 像素定位 + 横滑跟手
```
