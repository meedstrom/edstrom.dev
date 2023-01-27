module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        use: "raw-loader",
      },
      {
        test: /\.html$/i,
        use: "html-loader"
      }
    ],
  },
};
