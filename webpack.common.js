const path = require('path');
const webpack = require('webpack');

module.exports = {
  module: {
    // configuration regarding modules
    rules: [
      // rules for modules (configure loaders, parser options, etc.)
      {
        test: /\.js[x]?$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                shippedProposals: true, // to support spread operators
                forceAllTransforms: true
              }],
              '@babel/preset-react',
            ],
            plugins: [
              ['transform-imports', {
                'react-bootstrap': {
                  // eslint-disable-next-line
                  transform: 'react-bootstrap/lib/${member}',
                  preventFullImport: true
                },
                lodash: {
                  // eslint-disable-next-line
                  transform: 'lodash/${member}',
                  preventFullImport: true
                },
                'react-icons': {
                  // eslint-disable-next-line
                  transform: 'react-icons/md/${member}',
                  preventFullImport: true
                }
              }],
              '@babel/plugin-syntax-dynamic-import',
              'transform-function-bind',
              ['transform-class-properties', { spec: true }],
              '@babel/plugin-proposal-optional-chaining',
              ['@babel/plugin-transform-runtime', {
                regenerator: true
              }],
              '@babel/plugin-proposal-export-default-from'
            ],
          }
        }
      },
      {
        test: /\.node$/,
        use: [
          { loader: 'node-loader' },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.node'],
    alias: {
      src: path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
    }
  },
  plugins: [
    new webpack.IgnorePlugin(/^electron$/)
  ] 
};
