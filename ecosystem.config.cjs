module.exports = {
  apps: [
    {
      name: "buchhaltung-api",
      cwd: "/home/users/emilio/www/buchhaltung-cms",
      script: "dist-server/server/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        API_PORT: "4000",
      },
    },
    {
      name: "buchhaltung-web",
      cwd: "/home/users/emilio/www/buchhaltung-cms",
      script: "npm",
      args: "run preview -- --host 127.0.0.1 --port 3050 --strictPort",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
