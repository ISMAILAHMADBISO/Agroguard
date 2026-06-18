const app = require("../artifacts/api-server/dist/app.cjs");

const config = {
  maxDuration: 60,
};

function handler(req, res) {
  const expressApp = app.default || app;
  return expressApp(req, res);
}

module.exports = handler;
module.exports.config = config;
