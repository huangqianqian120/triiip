const path = require('path');

module.exports = {
  entry: './src/popup/index.js', // 明确指定入口
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: 'popup.js',
  },
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