const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  entry: "./src/index.js", // Your entry point
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      // Your loaders (e.g., babel-loader, css-loader, etc.)
    ],
  },
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      fs: false, // Disable fs module
    },
  },
  plugins: [
    new NodePolyfillPlugin(),
    // Other plugins
  ],
};
