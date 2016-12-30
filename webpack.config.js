var CopyWebpackPlugin = require('copy-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    PathRewriterPlugin = require('webpack-path-rewriter'),
    autoprefixer = require('autoprefixer'),
    path = require('path'),
    version = require('./version'),
    webpack = require('webpack');

/*
  Hack to make webpack dev server server up HTML for blank pages.
  If this doesn't work for you, you may have to try reinstalling
  the webpack-dev-server and/or webpack-dev-middleware NPM module
  *after* installing the mime NPM module.

  This helps ensure a singleton instance of mime that we can modify.
*/
var mime = require('mime');
mime.default_type = "text/html";

/*
  Are we in production mode? We also include staging (or any other non-
  development environment) as prod-like for webpack purposes, but pass
  the actual environment to the config file.
*/
var NODE_ENV = process.env.NODE_ENV || 'development';
var prodLike = (NODE_ENV !== 'development');
var VERSION = version();

var config = {
  entry: {
    groups: "./groups.js",
    vendor: [
      './js/promise-fetch',
      'crypto-js/sha1',
      'jquery',
      'lodash',
      'react',
      'react-dom',

      // Single generic CSS vendor file
      "./less/vendor.less"
    ],

    // Playground / Style-guide
    guide: "./guide.js"
  },

  output: {
    path: path.join(__dirname, "pub"),
    publicPath: "/",
    filename: "js/[name]--" + (prodLike ? "[chunkhash]" : "dev") + ".js",
    chunkFilename: "js/[name]--" + (prodLike ? "[chunkhash]" : "dev") + ".js"
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
          name: "[path][name]",
          context: "html",
          includeHash: true,
          loader: 'nunjucks-html?' + JSON.stringify({
            searchPaths: [ path.join(__dirname, "html") ],

            // Nunjucks / Jinja context
            context: {
              PRODUCTION: prodLike,
              VERSION: VERSION
            }
          })
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
        include: [ path.resolve(__dirname, "./assets") ]
        // exclude: /\.html$/
      },

      { test: /\.(woff|woff2|eot|ttf|svg)(\?.*)?$/,
        loader: "file?context=node_modules&name=fonts/[name].[ext]",
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
      ENV: JSON.stringify(NODE_ENV),
      ESPER_VERSION: JSON.stringify(VERSION),

      /*
        Need to treat prod-like as "production" here because some libs
        rely on process.env.NODE_ENV being "production" when minimizing
      */
      'process.env': {
        'NODE_ENV': JSON.stringify(prodLike ? "production" : NODE_ENV)
      }
    }),

    new ExtractTextPlugin(
      "css/[name]--" + (prodLike ? "[contenthash]" : "dev") + ".css",
      { allChunks: true }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "js/[name]--" + (prodLike ? "[chunkhash]" : "dev") + ".js"
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
  },

  worker: {
    output: {
      filename: "js/[name].worker--" +
        (prodLike ? "[chunkhash]" : "dev") + ".js",
      chunkFilename: "js/[name].worker--" +
        (prodLike ? "[chunkhash]" : "dev") + ".js"
    }
  }
};

if (! prodLike) {
  /*
    Copies files from sibling lutra directory over so lutra can serve them.
    This should not error even if context dir is missing though. Only do
    this for dev (deploy prod lutra via lutra's own makefile)
  */
  config.plugins.push(
    new CopyWebpackPlugin([{
      context: "../lutra/esper.com/pub/",
      from: "**/*",
      to: ""
    }])
  );
}

if (prodLike) {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    // Disable warnings about un-reachable conditions and what not. Most
    // of those are intentional (e.g. via webpack.DefinePlugin)
    compress: {warnings: false}
  }));
}

module.exports = config;
