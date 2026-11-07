// PM2 测试实例配置 — 不碰正式版
module.exports = {
  apps: [
    {
      name: 'football-news-test',
      script: 'src/server/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'test',
        PORT: 3011,
        BASE_PATH: '/football-test/',
        DB_PATH: './data/news.db',
        ENABLE_SHARE: 'false',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      max_memory_restart: '300M',
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
}
