// PM2 进程管理配置
module.exports = {
  apps: [
    {
      name: 'football-news',
      script: 'src/server/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // 分享功能开关：备案完成后改为 'true'，然后 pm2 restart
        // ENABLE_SHARE: 'true',
      },
      // 日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      // 自动重启
      max_memory_restart: '300M',
      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
}
