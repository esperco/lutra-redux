var ExtractTextPlugin = require('extract-text-webpack-plugin'),
    PathRewriterPlugin = require('webpack-path-rewriter'),
    autoprefixer = require('autoprefixer'),
    path = require('path'),
    webpack = require('webpack');

/*
  Are we in production mode? We also include staging (or any other non-
  development environment) as prod-like for webpack purposes, but pass
  the actual environment to the config file.
*/
var NODE_ENV = process.env.NODE_ENV || 'development';
var prodLike = (NODE_ENV !== 'development');

var config = {
  entry: {
    groups: "./groups.js",
    "groups-vendor": [
      'jquery',
      'lodash',
      'react',
      'react-dom'
    ]
  },
  output: {
    path: path.join(__dirname, "pub"),
    publicPath: "/",
    filename: "js/[name]-" + (prodLike ? "[chunkhash]" : "") + ".js",
    chunkFilename: "js/[name]-" + (prodLike ? "[chunkhash]" : "") + ".js"
  },


  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],

    alias: {
      // Special config path based on environment
      config: path.join(__dirname, 'config', NODE_ENV)
    }
  },

  module: {
    loaders: [
      { test: /\.html?$/,
        loader: PathRewriterPlugin.rewriteAndEmit({
          name: "[path][name].html",
          context: "assets",
          includeHash: true
        })
      },

      { test: /\.less?$/,
        loader: ExtractTextPlugin.extract("style-loader",
          "css?" + (prodLike ? "minimize" : "") + "sourceMap" +
          "!postcss?sourceMap" +
          "!less?sourceMap"
        )
      },

      { test: /\.css?$/,
        loader: ExtractTextPlugin.extract("style-loader",
          "css?" + (prodLike ? "minimize" : "") + "sourceMap" +
          "!postcss?sourceMap"
        )
      },

      { test: /\.tsx?$/, loader: "ts-loader" },

      // Static assets
      { test: /.*/,
        loader: "file?context=assets&name=[path][name].[ext]",
        include: [ path.resolve(__dirname, "./assets") ],
        exclude: /\.html$/
      },

      { test: /\.(woff|woff2|eot|ttf|svg)(\?.*)?$/,
        loader: "file?context=node_modules&name=[path][name].[ext]",
        include: [ path.resolve(__dirname, "./node_modules") ]
      }
    ],

    preLoaders: [
      /*
        All output '.js' files will have any sourcemaps re-processed by
        'source-map-loader'.
      */
      { test: /\.js$/, loader: "source-map-loader" }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      ENV: NODE_ENV,

      /*
        Need to treat prod-like as "production" here because some libs
        rely on process.env.NODE_ENV being "production" when minimizing
      */
      'process.env': {
        'NODE_ENV': JSON.stringify(prodLike ? "production" : NODE_ENV)
      }
    }),

    new ExtractTextPlugin(
      "css/[name]-" + (prodLike ? "[contenthash]" : "") + ".css",
      { allChunks: true }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "groups-vendor",
      filename: "js/[name]-" + (prodLike ? "[chunkhash]" : "") + ".js"
    }),
    new PathRewriterPlugin()
  ],

  postcss: function () {
    return [autoprefixer({
      browsers: ['last 3 versions']
    })];
  },

  devServer: {
    historyApiFallback: true
  }
};

if (prodLike) {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    // Disable warnings about un-reachable conditions and what not. Most
    // of those are intentional (e.g. via webpack.DefinePlugin)
    compress: {warnings: false}
  }));
}

module.exports = config;
