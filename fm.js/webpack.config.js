var path = require('path');
var webpack = require('webpack');

let entries = ['./src/fm-main.js'];
let diced = {};
for (const entry of entries) {
  diced[path.basename(entry)] = entry
}

module.exports = {
  entry: diced,
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '',
    filename: '[name]'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', {loader: 'css-loader', options: {importLoaders: 1}}
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader', {loader: 'css-loader', options: {importLoaders: 1}},
          'less-loader'
        ]
      },
      {test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/}, {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {name: '[path][name].[ext]'}
      },
      {test: /\.woff$/, loader: 'url-loader?mimetype=application/font-woff'},
      {test: /\.woff2$/, loader: 'url-loader?mimetype=application/font-woff'},
      {test: /\.eot$/, loader: 'url-loader?mimetype=application/font-woff'},
      {test: /\.ttf$/, loader: 'url-loader?mimetype=application/font-woff'}

    ]
  },
  plugins: [
    new webpack.ProvidePlugin({jQuery: 'jquery', $: 'jquery'}),
  ],
  resolve: {alias: {'vue$': 'vue/dist/vue.esm.js'}},
  devServer: {historyApiFallback: true, noInfo: true},
  performance: {hints: false},
  devtool: '#eval-source-map',
};

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map';
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({'process.env': {NODE_ENV: '"production"'}}),
    new webpack.optimize.UglifyJsPlugin(
        {sourceMap: false, compress: {warnings: false}}),
    new webpack.LoaderOptionsPlugin({minimize: true})
  ]);
}
