const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    options: './src/options.tsx'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: 'chrome 88',
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
              }],
              '@babel/preset-typescript',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
            plugins: [
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { 
                targets: 'chrome 88',
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3
              }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
            plugins: [
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      }
    ]
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        }
      }
    },
    minimize: true,
    usedExports: true,
    sideEffects: false
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 500000,
    maxAssetSize: 500000
  },
  externals: {
    chrome: 'chrome'
  }
};
