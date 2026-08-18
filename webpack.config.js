const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/popup/index.js', // 明确指定入口
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: 'popup.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(process.env.DEEPSEEK_API_KEY || ''),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  mode: 'production',
}; 