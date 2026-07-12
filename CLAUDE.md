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

### 滚动驱动的动画：用 DOM 操作，不用 React 状态
- **根因**: 面板 `onScroll` → React `setState` → 重渲染 → `maxHeight` 变化 → flex 重新布局 → 面板高度变化 → 触发新 scroll 事件 → 死循环闪烁。`collapsingRef` 守卫也解决不了，反而导致掉帧和状态不一致。
- **表现**: 页面疯狂闪烁、停不下来；或动画卡顿、切页后状态随机。
- **教训**: 滚动驱动的视觉动画（DateHeader 翻折）**直接操作 DOM**，配合 `requestAnimationFrame` 节流。不经过 React 状态，不触发重渲染。只改 `transform`/`opacity`（GPU 合成），不改布局属性。

### 固定区 vs 滚动区的职责分离
- **根因**: DateHeader + Tabs 放进面板内 → 随 carousel `translateX` 横滑，整个页面都在动。拿出来全局 → 滚动驱动的折叠用 JS，两段式滚动丢失。反复横跳。
- **最终方案**: DateHeader + Tabs **全局固定**（不参与横滑），面板内**只有新闻内容**。折叠用 JS 监听面板 scrollTop + 直接 DOM 操作。Tabs 的选中指示器用 `left` 定位 + carousel 的 `swipeOffset` 驱动跟手移动。
- **关键原则**: 用户眼睛看到"不动"的东西（头部、标签），DOM 里就让它真的不动。动的只有该动的（新闻卡片、指示框）。

### translateX 百分比基准陷阱
- **根因**: `translateX(200%)` 的百分比相对**元素自身宽度**。元素宽 `calc(100%/3)`，自身宽度的 200% = 容器 66.67%，叠加浮点误差 → 第三个标签指示器超出底板。
- **教训**: 需要"元素在容器内三等分定位"时，用 `left`（相对容器）不 用 `translateX`（相对自身）。`left: calc(N * 100% / 3)` 精确到容器三等分点，不累积误差。

### 切页保持 UI 状态一致性
- **根因**: DateHeader 在各面板内独立存在，切页时各自 scrollTop 不同 → 有的展开有的折叠。一刀切设 `scrollTop = headerHeight` → 原本展开的也被强制折叠。
- **方案**: 用全局 ref（`headerVisibleRef`）追踪 DateHeader 显隐。切页时读 ref → visible 则新页 `scrollTop=0`，hidden 则 `scrollTop=headerHeight`。状态跨面板一致。

## 项目结构

```
src/
  lib/
    newsFilter.ts           # 数据过滤、字段标准化、源名推断
    feedRanker.ts           # 每日消息智能混排引擎（时间+偏好+热度+已读+打散）
  server/
    index.ts                # Express API + 定时任务
    fetcher.ts              # 直播吧 JSON 抓取
    storage.ts              # SQLite CRUD + 清理
    reader.ts               # 文章正文提取（Readability）
  components/
    NewsCard.tsx            # 新闻卡片（card 模式：图片+标题+元信息，无 Card 壳）
    NewsList.tsx            # 新闻列表（columns=1/2）
    NewsPanels.tsx          # 三个频道的共享面板渲染（消除 App.tsx 两处重复）
    HotEditorialFeed.tsx    # 近期热点编辑首页（头条 → 双次头条 → 持续关注）
    NewsSkeleton.tsx        # 双列骨架屏
    CarouselPanel.tsx       # 轮播面板：独立滚动 + 独立底色 + 下拉刷新 + 无限滚动
    DateHeader.tsx          # 日期顶栏（撕票根动画）
    ReaderView.tsx          # 阅读模式视图（进度条监听滚动容器）
    PullToRefresh.tsx       # 下拉刷新
    LoadMoreSentinel.tsx    # 无限滚动哨兵
    PreferencePanel.tsx     # 偏好设置（联赛+球队）
    BookmarkList.tsx        # 收藏列表
    SearchBar.tsx           # 搜索栏
    Drawer.tsx              # 侧滑抽屉
    Toast.tsx               # Toast 提示
    ui/                     # shadcn 组件
  hooks/
    useNewsFeed.ts          # 新闻分页加载
    useReadHistory.ts       # 已读记录（localStorage 持久化）
    useSearch.ts            # 搜索逻辑
    useBookmarks.ts         # 收藏逻辑
    useTheme.ts             # 主题切换
  App.tsx                   # 主页面：
                            #   全局 DateHeader + Tabs + Carousel 三面板
                            #   每日消息 = 智能混排双列瀑布流
                            #   近期热点 = 单列阅读流（list 模式）
                            #   世界杯 = 时间序双列瀑布流
```

## 视觉系统

- **风格**: 专业体育媒体风 — 纸感暖白底 + 石墨黑文字 + 深草坪绿强调色
- **色彩**: 背景 `#F7F7F4`，文字 `#171A18`，次要 `#6E746F`，分割线 `#E3E5E0`，强调 `#1F5A42`
- **字体**: 标题优先宋体/衬线 `Noto Serif SC → Songti SC → STSong`，正文 `Geist Variable → PingFang SC`
- **圆角**: 全局 4px（`--radius: 0.25rem`），图片 5px
- **卡片**: 不用 shadcn Card 组件，图片+标题+元信息自然排布，无阴影，靠留白区分
- **Tab**: 编辑导航风格——石墨黑文字 + 深草坪绿下划线（2px），底部淡暖灰分割线
- **热度**: 等级化标签（热议/高热/持续关注），不展示原始数字
- **已读**: 标题降低对比度 + 图片降低饱和度和透明度（opacity-60 saturate-50）

## 每日消息智能混排

排序公式: `score = timeScore + preferenceScore × 0.35 + hotScore × 0.2 - readPenalty(0.35)`

- `timeScore`: 指数衰减 `2^(-hours/6)`，保证新鲜度
- `preferenceScore`: 标签/标题命中数（上限3），偏好内容上浮但不过滤
- `hotScore`: `log10(count+1)/7` 归一化到 0~1
- `readPenalty`: 已读固定扣分（下沉但不消失）
- 打散: 同源最多连续 2 条

排序逻辑封装在 `lib/feedRanker.ts`，参数可调，有 23 个单测。

## 阅读模式进度条

- 滚动容器是 `fixed` 覆盖层（body overflow:hidden），window 不会触发 scroll
- 通过 `scrollContainerRef` 传递给 `ReadingProgress`，监听容器 scrollTop 而非 window.scrollY
