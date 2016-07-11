// TODO: see if you can use ES6 without babel (just with node which supports ES6)
// Add unsupported ES6/7 methods
// Must be before everything else
import 'babel-polyfill';

import {create as createBrowserSyncServer} from 'browser-sync';
import {exec} from 'child_process';
import del from 'del';
import {readFileSync} from 'fs';
import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import changed from 'gulp-changed';
import plumber from 'gulp-plumber';
import size from 'gulp-size';
import sourcemaps from 'gulp-sourcemaps';
import tslint from 'gulp-tslint';
import typescript from 'gulp-typescript';
import {env, log, File} from 'gulp-util';
import jspm from 'jspm';
import jspmConfig from 'jspm/lib/config';
import split from 'split2';
import through from 'through2';

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
 * Copy JSPM config and install all deps
 */

gulp.task('jspm/config:copy', function () {
	return gulp
		.src([
			'jspm.config.js',
			'package.json'
		])
		.pipe(changed(PATHS.dist))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist));
});

gulp.task('jspm/config:build', function () {
	// Set JSPM config path
	jspm.setPackagePath(PATHS.dist);
	// Load JSPM config
	jspmConfig.loadSync();
	// Get JSPM config
	const JSPM_CONFIG = jspmConfig.loader.getConfig();
	return gulp
		.src(`${PATHS.dist}/jspm.config.js`)
		.pipe(updateEnv(JSPM_CONFIG))
		.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
		.pipe(gulp.dest(PATHS.dist));
});

function updateEnv(config) {
	config.production = env.ILOOP_PROD_MODE || env.production || false;
	return through.obj((chunk, enc, callback) => {
		chunk.contents = new Buffer(`SystemJS.config(${JSON.stringify(config)})`, 'utf8');
		callback(null, chunk);
	});
}

gulp.task('jspm/install', function () {
	let proc = exec(`${__dirname}/node_modules/.bin/jspm install`, {cwd: PATHS.dist});

	proc.stdout
		.pipe(split())
		.on('data', (data) => log(data));

	proc.stderr
		.pipe(split())
		.on('data', (data) => log(data));

	return proc;
});


/**
 * Build dependencies
 */
gulp.task('build/deps', gulp.series(
	'jspm/config:copy',
	'jspm/config:build',
	'jspm/install'
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
 * App builds
 */
gulp.task('build/app', gulp.parallel(
	'build/static',
	'build/html',
	'build/js',
	'build/css'
));


/**
 * Build modules
 * Note that, before running this task, `build/deps` must be run.
 */
gulp.task('build/modules', gulp.series(
	// Build configuration
	function config(done) {
		let paths = new Map();
		let modulesConfig = [];

		let stream = gulp
			.src('./modules.config.json')
			.pipe(plumber())
			.pipe(through.obj(
				// Build a modules config object based on the modules json configuration:
				// 1. Read the contents of the modules json config
				// 2. Build the modules config object
				(file, enc, cb) => {
					let contents = readFileSync(file.path);
					let configs = JSON.parse(contents);

					for (let module of Object.keys(configs)) {
						let {name, path} = parseModule(module);
						// Get module config
						modulesConfig.push(configs[module]);
						// Set list of modules
						paths.set(name, path);
					}

					cb();
				},
				// Based on the modules config from the above step, build a config file to be used by the app:
				// 1. Add import for each package
				// 2. Add the modules config object as a constant export
				// 3. Append all to the config file
				function (cb) {
					let contents = '';

					for (let name of paths.keys()) {
						contents += `import '${name}';\n`;
					}
					contents += `\nconst MODULES_CONFIG = ${JSON.stringify(modulesConfig, null, 4)};\n`;
					contents += '\nexport default MODULES_CONFIG ;';

					this.push(
						new File({
							contents: new Buffer(contents),
							path: 'modules.config.ts'
						})
					);

					cb();
				}
			))
			// TS needs a physical location for the files,
			// thus the below save in dist.
			.pipe(gulp.dest(PATHS.dist))
			.pipe(typescript(typescript.createProject('tsconfig.json', {
				typescript: require('typescript')
			})))
			.js
			.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
			.pipe(gulp.dest(PATHS.dist));

		stream.on('end', () => {
			del([`${PATHS.dist}/modules.config.ts`]).then(() => {
				done();
			});
		});
	},
	// Install each module as a jspm package
	function install() {
		let contents = readFileSync('./modules.config.json');
		let json = JSON.parse(contents);
		let proc;

		let packages = '';
		for (let module of Object.keys(json)) {
			let {name, path} = parseModule(module);
			packages += `${name}=${path} `;
		}

		proc = exec(`${__dirname}/node_modules/.bin/jspm install ${packages}`, {cwd: PATHS.dist});

		proc.stdout
			.pipe(split())
			.on('data', (data) => log(data));
		proc.stderr
			.pipe(split())
			.on('data', (data) => log(data));

		return proc;
	}
));

function parseModule(module) {
	let name;

	if (module.indexOf('@') !== -1) {
		name = module.substr(0, module.indexOf('@'));
	} else {
		name = module;
	}

	if (name.indexOf(':') !== -1) {
		name = name.split(':')[1];
	}

	return {
		name,
		path: module
	};
}


/**
 * Build everything
 */
gulp.task('build', gulp.series(
	'build/deps',
	'build/modules',
	'build/app'
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
