// PM2 process definitions for GateKeeper.
//
// Usage (run from the project root, after `npm run build:frontend` once):
//   pm2 start ecosystem.config.js
//   pm2 save            # remember this process list across reboots
//   pm2 logs             # view combined logs
//   pm2 restart all      # restart both after pulling new code
//   pm2 stop all         # stop both
//
// PM2 keeps these running in the background even after you close the
// terminal/VS Code — they're managed by a separate pm2 daemon process.
module.exports = {
  apps: [
    {
      name: "gatekeeper-backend",
      cwd: "./backend",
      script: "server.js",
      env: { NODE_ENV: "production" },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "gatekeeper-frontend",
      cwd: "./frontend",
      // Serves the production build (npm run build) — NOT the dev server.
      // Run `npm run build --prefix frontend` (or `npm run build:frontend`
      // from the root) any time frontend code changes, then restart this
      // process to pick it up.
      script: "npm",
      args: "run preview -- --host",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
