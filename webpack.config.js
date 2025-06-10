const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    'brain-wallet': './src/brain-wallet.js',
    'bbqr': './src/bbqr.js',
    'qr': './src/qr.js',
    'psbt': './src/psbt.js',
    'convert': './src/convert.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions']
                }
              }]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    fullySpecified: false,
    extensionAlias: {
      '.js': ['.js', '.ts']
    },
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util"),
      "assert": require.resolve("assert"),
      "url": require.resolve("url"),
      "vm": require.resolve("vm-browserify"),
      "fs": false,
      "path": require.resolve("path-browserify")
    }
  },
  externals: {
    fs: 'commonjs fs'
  },
  experiments: {
    topLevelAwait: true
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
}; 