module.exports = {
  apps: [
    {
      name: "blog",
      cwd: __dirname,
      script: "pnpm",
      args: "run preview",
      env: {
        NODE_ENV: "production",
        PORT: 8888,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 5000,
    },
  ],
};