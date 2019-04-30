const path = require('path');

module.exports = {
  entry: './src/test.jsx',
  mode: 'development',
  output: {
    path: path.resolve('.'),
    filename: './public/javascripts/test.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
