const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CheckerPlugin } = require("awesome-typescript-loader");
const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "../docs"),
    filename: "bundle.min.js",
  },
  mode: "development",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },

  // Source maps support ('inline-source-map' also works)
  devtool: "source-map",

  // Add the loader for .ts files.
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } },
          "postcss-loader",
        ],
      }

    ],
    noParse: [/benchmark/],
  },
  plugins: [
    new CopyWebpackPlugin([
      "index.html",
      "../target/wasm32-unknown-unknown/release/particles.wasm",
    ]),
  ],
};
