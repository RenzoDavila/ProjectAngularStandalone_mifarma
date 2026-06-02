// ecosystem.config.js — PM2 Configuration for Angular SSR
// Deploy: pm2 start ecosystem.config.js --env production
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      // ─── App Identity ───────────────────────────────────────────────────
      name: 'mifarma-ssr',
      script: './dist/mifarma/server/server.mjs',

      // ─── Entorno de Producción ──────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,                    // Puerto interno (Nginx hace proxy a este)
        NODE_OPTIONS: '--max-old-space-size=512',
      },

      env_development: {
        NODE_ENV: 'development',
        PORT: 4000,
      },

      // ─── Cluster Mode ───────────────────────────────────────────────────
      // 'max': usa todos los CPUs disponibles del VPS.
      // Cada worker es un proceso Node.js independiente (sin GIL).
      // Para un VPS de 2 vCPUs → 2 instancias → duplica el throughput HTTP.
      exec_mode: 'cluster',
      instances: 'max',

      // ─── Watch & Restart ────────────────────────────────────────────────
      watch: false,                     // Desactivado en producción
      ignore_watch: ['node_modules', 'logs'],

      // ─── Memory Management ──────────────────────────────────────────────
      // Reinicia automáticamente si supera 512MB (previene memory leaks)
      max_memory_restart: '512M',

      // ─── Logging ────────────────────────────────────────────────────────
      log_file: './logs/pm2-combined.log',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ─── Auto-restart Policy ────────────────────────────────────────────
      // restart_delay: espera 1s entre reinicios (previene restart loops)
      // max_restarts: máximo 10 reinicios en la ventana de tiempo
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '5s',                  // Mínimo tiempo de vida para ser "estable"

      // ─── Graceful Shutdown ──────────────────────────────────────────────
      // Angular SSR con Express necesita tiempo para cerrar conexiones HTTP activas
      kill_timeout: 5000,

      // ─── Startup ────────────────────────────────────────────────────────
      // Hace que PM2 arranque automáticamente con el sistema operativo
      // (requiere: pm2 startup && pm2 save)
      autorestart: true,
    },
  ],
};
