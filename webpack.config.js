const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			}
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		alias: {
			// svgo: require.resolve('svgo/dist/svgo.browser')
		}
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new CopyWebpackPlugin({
            patterns: [
                {
					from: 'static',
					globOptions: {
						ignore: ['**/index.html']
					}
				}
            ]
        }),
		new HtmlWebpackPlugin({
			title: 'SVG',
			template: 'static/index.html'
		})
	],

	devServer: {
		static: path.join(__dirname, 'static'),
		compress: true,
		port: 4000,
	},
};