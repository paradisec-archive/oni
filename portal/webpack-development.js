const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack-common");
const CopyPlugin = require("copy-webpack-plugin");

const configuration = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
      }

      const allowedOrigins = ['https://api.github.com'];
      middlewares.unshift((req, res, next) => {
          if (req.method === 'OPTIONS') {
            const origin = req.headers.origin;
            if (allowedOrigins.includes(origin)) {
              res.header('Access-Control-Allow-Origin', origin);
            } else {
              res.header('Access-Control-Allow-Origin', '');
            }
              res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
              res.header('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
              res.sendStatus(204); // No Content
          } else {
              next();
          }
      });

      return middlewares;
  },
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    host: "0.0.0.0",
    port: 11000,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/api/**': {
        target: 'http://[::1]:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
});

module.exports = configuration;
