import 'babel-polyfill'; // Add unsupported ES6/7 methods
import autoprefixer from 'gulp-autoprefixer';
import changed from 'gulp-changed';
import {create as createBrowserSyncServer} from 'browser-sync';
import {env} from 'gulp-util';
import del from 'del';
import gulp from 'gulp';
import jspmConfig from 'jspm/lib/config';
import plumber from 'gulp-plumber';
import size from 'gulp-size';
import sourcemaps from 'gulp-sourcemaps';
import through from 'through2';
import tslint from 'gulp-tslint';
import typescript from 'gulp-typescript';


const bs = createBrowserSyncServer('iLoop');

const BS_CONFIG = require('./bs.config');
const GULP_SIZE_DEFAULT_CONFIG = {
	showFiles: true,
	gzip: false
};

const PATHS = {
	typings: [
		// Ensures ES6/7 API definitions are available when transpiling TS to JS.
		'node_modules/typescript/lib/lib.es2017.d.ts',
		'node_modules/typescript/lib/lib.dom.d.ts',
		// Typings definitions for 3rd party libs
		'typings/index.d.ts'
	],
	src: {
		ts: ['src/app/**/*.ts'],
		static: ['src/assets/**/*.{svg,jpg,png,ico,txt}'],
		css: ['src/**/*.css'],
		html: [
			'src/app/**/*.html',
			'src/index.html'
		]
	},
	dist: 'dist'
};


/**
 * Start a web server using BS
 * See https://www.browsersync.io/docs
 */
gulp.task(function server() {
	bs.init(BS_CONFIG);
	// When process exits kill browser-sync server
	process.on('exit', () => {
		bs.exit();
});
});


/**
 * Copy JSPM assets
 */

gulp.task('jspm:config', function () {
	jspmConfig.loadSync();
	return gulp
		.src('jspm.config.js')
		.pipe(changed(PATHS.dist))
		.pipe(transform(jspmConfig.loader.getConfig()))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist));
});

function transform(config) {
	config.production = env.ILOOP_PROD_MODE || env.production || false;
	return through.obj((chunk, enc, callback) => {
		chunk.contents = new Buffer(`SystemJS.config(${JSON.stringify(config)})`, 'utf8');
		callback(null, chunk);
	});
}

gulp.task('jspm:packages', function () {
	return gulp
		.src([
			'jspm_packages/**/.*',
			'jspm_packages/**/*'
		], {
			base: '.'
		})
		.pipe(changed(PATHS.dist))
		// .pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist));
});

gulp.task('build/deps', gulp.parallel(
	'jspm:packages',
	'jspm:config'
));


/**
 * Copy static assets
 */
gulp.task('build/static', function () {
	return gulp
		.src(PATHS.src.static)
		.pipe(changed(PATHS.dist))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist))
		.pipe(bs.stream({
			match: '**/*.{svg,jpg,png,ico,txt}'
		}));
});


/**
 * Copy HTML
 */
gulp.task('build/html', function () {
	return gulp
		.src(PATHS.src.html, {
			base: './src'
		})
		.pipe(changed(PATHS.dist))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist))
		.pipe(bs.stream({
			match: '**/*.html'
		}));
});


/**
 * Build JS
 */
gulp.task('build/js', function () {
	return gulp
		.src([].concat(PATHS.typings, PATHS.src.ts), {
			base: './src'
		})
		.pipe(changed(PATHS.dist, {
			extension: '.js'
		}))
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(typescript(typescript.createProject('tsconfig.json', {
			typescript: require('typescript')
		})))
		.js
		.pipe(sourcemaps.write('.'))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist))
		.pipe(bs.stream({
			match: '**/*.js'
		}));
});


/**
 * Build CSS
 */
gulp.task('build/css', function () {
	return gulp
		.src(PATHS.src.css)
		.pipe(changed(PATHS.dist, {
			extension: '.css'
		}))
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('.'))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist))
		.pipe(bs.stream({
			match: '**/*.css'
		}));
});


/**
 * Build everything
 */
gulp.task('build', gulp.parallel(
	'build/deps',
	'build/static',
	'build/html',
	'build/js',
	'build/css'
));


/**
 * Check code integrity (lint)
 * `tslint.json` contains enabled rules.
 * See https://github.com/palantir/tslint#supported-rules for more rules.
 */
gulp.task(function lint(done) {
	return gulp
			.src(PATHS.src.ts)
			.pipe(plumber())
			.pipe(tslint({
				tslint: require('tslint') // Use a different version of tslint
			}))
			.pipe(tslint.report('verbose', {
				summarizeFailureOutput: true,
				emitError: true
			}))
			.on('error', (error) => done(error));
});



/**
 * Start server and open app in browser
 */
gulp.task('serve', gulp.series(
	'build',
	function start() {
		// Start watching files for changes
		gulp.watch(PATHS.src.ts, gulp.task('build/js'));
		gulp.watch(PATHS.src.static, gulp.task('build/static'));
		gulp.watch(PATHS.src.css, gulp.task('build/css'));
		gulp.watch(PATHS.src.html, gulp.task('build/html'));
		// Start BS server
		gulp.task('server')();
	}
));


/**
 * Default
 */
gulp.task('default', gulp.task('serve'));


/**
 * Clean
 */
gulp.task(function clean() {
	return del([PATHS.dist]);
});
