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
    NewsCard.tsx           # 新闻卡片（缩略图+标签+来源+时间）
    NewsList.tsx           # 列表 + 空状态
    DateHeader.tsx         # 日期顶栏
    ReaderView.tsx         # 阅读模式视图
    PullToRefresh.tsx      # 下拉刷新
    LoadMoreSentinel.tsx   # 无限滚动哨兵
    ui/                    # shadcn 组件
  hooks/useNews.ts         # 前端数据加载
  App.tsx                  # 主页面（标签切换 + 阅读模式路由）
```
