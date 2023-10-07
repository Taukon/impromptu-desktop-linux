const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin, IgnorePlugin } = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const optionalPlugins = [];
if (process.platform !== "darwin") {
  optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /^fsevents$/ }));
}


const isDev = process.env.NODE_ENV === 'development';


const main = {
  mode: isDev ? 'development' : 'production',

  target: 'electron-main',
  //target: 'node',
  entry: {
    main: './src/main/index.ts',
  },

  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        //exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: path.resolve(__dirname, "./build/Release/screenshot.node"), 
          to: path.resolve(__dirname, "dist") 
        },
        { 
          from: path.resolve(__dirname, "./build/Release/converter.node"), 
          to: path.resolve(__dirname, "dist") 
        },
        { 
          from: path.resolve(__dirname, "./build/Release/xtest.node"), 
          to: path.resolve(__dirname, "dist") 
        },
      ],
    }),
    ...optionalPlugins 
  ],
};


const preload = {
  mode: isDev ? 'development' : 'production',

  target: 'electron-preload',
  entry: {
    preload: './src/preload/index.ts',
  },

  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        //exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  plugins: [ ...optionalPlugins ],
};


const renderer = {
  mode: 'production',

  target: 'web',
  entry: {
    renderer: './src/renderer/index.ts',
  },
  
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    filename: '[name].js',
    assetModuleFilename: 'images/[name][ext]',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: isDev },
          },
        ],
      },
      {
        test: /\.(bmp|ico|gif|jpe?g|png|svg|ttf|eot|woff?2?)$/,
        type: 'asset/resource',
      },
    ],
  },
  devtool: isDev ? 'inline-source-map' : false,
  plugins: [
    ...optionalPlugins,
    new DefinePlugin({
      'process.env.VERSION_ENV': `"${require('./package.json').version}"`,
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: !isDev,
      inject: 'body',
      filename: 'index.html',
      scriptLoading: 'blocking',
    }),
    new MiniCssExtractPlugin(),
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },
};


module.exports = [main, preload, renderer];
