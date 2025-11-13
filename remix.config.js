/** @type {import('@remix-run/dev').AppConfig} */
export default {
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  server: "./server.ts",
  ignoredRouteFiles: ["**/.*"],
  tailwindcss: true,
  postcss: true,
};

