const path = require('path');

module.exports = {
  entry: {
    background: './src/background.ts',
    content: './src/content.ts'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};
