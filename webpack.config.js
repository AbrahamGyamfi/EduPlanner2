module.exports = {
  // ...existing code...
  devtool: 'source-map', // Keep source maps for your code
  module: {
    rules: [
      // ...existing rules...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  // ...existing code...
};
