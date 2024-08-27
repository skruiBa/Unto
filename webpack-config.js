const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.js', // Entry point
  output: {
    filename: 'bundle.js', // Output file
    path: path.resolve(__dirname, 'public') // Output directory
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 9000
  }
};
