const path = require('path');

module.exports = {
  entry: './pia.ts',
  target: 'node',

  optimization: {
    minimize: false,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },

  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  
  output: {
    filename: 'pia.js',
    path: path.resolve('./vpn'),
  },
};
