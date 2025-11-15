const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    entry: {
      background: './src/background/background.ts',
      popup: './src/popup/index.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/manifest.json', to: 'manifest.json' },
          { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
          { from: 'public/_locales', to: '_locales', noErrorOnMissing: true },
        ],
      }),
      ...(isProduction ? [new MiniCssExtractPlugin()] : []),
    ],
    optimization: {
      minimize: isProduction,
    },
  };
};
