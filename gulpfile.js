const {create} = require('browser-sync');
const {exec, spawn} = require('child_process');
const del = require('del');
const {readFileSync} = require('fs');
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');
const size = require('gulp-size');
const sourcemaps = require('gulp-sourcemaps');
const tslint = require('gulp-tslint');
const typescript = require('gulp-typescript');
const {env, log, File} = require('gulp-util');
const jspm = require('jspm');
const jspmConfig = require('jspm/lib/config');
const split = require('split2');
const through = require('through2');

const bs = create('iLoop');

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

	proc.on('close', () => {
		// Reload the browser.
		// Only when BS is running.
		bs.reload('jspm.config.js');
	});

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
 * Build components
 * Note that, before running this task, `build/deps` must be run.
 */
let components = new Map();
let componentsModuleName = [];

gulp.task('build/components', gulp.series(
	// Build configuration
	function config(done) {
		let componentsConfig = new Map();
		// Reset global vars
		components = new Map();
		componentsModuleName = [];

		let stream = gulp
			.src('./components.config.json')
			.pipe(plumber())
			.pipe(through.obj(
				// Build a components config object based on the components json configuration:
				// 1. Read the contents of the components json config
				// 2. Build the components config object
				(file, enc, cb) => {
					let contents = readFileSync(file.path);
					let configs = JSON.parse(contents);

					for (let component of Object.keys(configs)) {
						let config = configs[component];
						let {name, path} = parseComponent(component);

						// Get component config
						componentsConfig.set(name, config);
						// Set list of components
						components.set(name, path);
					}

					cb();
				},
				// Based on the components config from the above step, build a config file to be used by the app:
				// 1. Add import for each package
				// 2. Set the state for each component
				// 3. Add the components config object as a constant export
				// 4. Append all to the config file
				function (cb) {
					let contents = '';

					// Set import
					for (let component of components.keys()) {
						let name = toCamelCase(component);

						// Import default export of component
						contents += `import ${name} from '${component}';\n`;

						// Set the {name} on the component config to be the exported module name
						componentsModuleName.push(name);
						let componentConfig = componentsConfig.get(component);
						componentConfig.name = `${name}.name`;

						// Generate typings for the above imports.
						// This ensures that there are not errors thrown during the TS compilation
						let typings = `declare module '${component}' {\n\tconst ${name}: any;\n\texport default ${name};\n}\n`;
						this.push(
							new File({
								contents: new Buffer(typings),
								path: `${name}.d.ts`
							})
						);
					}

					// Set states
					for (let componentConfig of componentsConfig.values()) {
						let {isProjectType} = componentConfig;
						let {state} = componentConfig.navigation;
						componentConfig.navigation.state = `root.${isProjectType ? 'project.' : ''}${state}`;
					}

					// Export the components config as default
					contents += `\nconst COMPONENTS_CONFIG = ${JSON.stringify(Array.from(componentsConfig.values()), null, 4)};\n`;

					// Remove quotes around the module name
					for (let name of componentsModuleName) {
						contents = contents.replace(new RegExp(`(['"])?(${name}\\.name)\\1`, 'g'), `${name}.name`);
					}

					contents += '\nexport default COMPONENTS_CONFIG;';

					this.push(
						new File({
							contents: new Buffer(contents),
							path: 'components.config.ts'
						})
					);

					cb();
				}
			))
			// TS needs a physical location for the files,
			// thus the below save in dist.
			.pipe(gulp.dest(PATHS.dist))
			// .pipe(size(GULP_SIZE_DEFAULT_CONFIG))
			.pipe(typescript(typescript.createProject('tsconfig.json', {
				typescript: require('typescript'),
				noEmitOnError: false,
				noResolve: true
			})))
			.js
			.pipe(size(GULP_SIZE_DEFAULT_CONFIG))
			.pipe(gulp.dest(PATHS.dist));

		stream.on('end', () => {
			// Cleanup:
			// 1. Remove generated typings
			// 2. Remove generated TS modules config (we only need the transpiled one)
			let typings = componentsModuleName.map((name) => `${PATHS.dist}/${name}.d.ts`);
			del([
				`${PATHS.dist}/components.config.ts`,
			].concat(typings)).then(() => {
				done();
			});
		});
	}
	// Install each component as jspm packages
	// function install() {
	// 	let proc;
    //
	// 	let packagesString = '';
	// 	for (let [name, path] of components.entries()) {
	// 		packagesString += `${name}=${path} `;
	// 	}
    //
	// 	proc = exec(`${__dirname}/node_modules/.bin/jspm install ${packagesString}`, {cwd: PATHS.dist});
    //
	// 	proc.stdout
	// 		.pipe(split())
	// 		.on('data', (data) => log(data));
	// 	proc.stderr
	// 		.pipe(split())
	// 		.on('data', (data) => log(data));
    //
	// 	proc.on('close', () => {
	// 		// Reload the browser.
	// 		// Only when BS is running.
	// 		bs.reload('components.config.json');
	// 	});
    //
	// 	return proc;
	// }
));

function toCamelCase(name) {
	// Set the name to be everything after the last '/'
	let index = name.lastIndexOf('/');
	if (index !== -1) {
		name = name.substr(index + 1);
	}

	// Convert hyphens to camel case
	// http://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
	return name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function parseComponent(component) {
	let name;

	if (component.indexOf('@') !== -1) {
		name = component.substr(0, component.indexOf('@'));
	} else {
		name = component;
	}

	if (name.indexOf(':') !== -1) {
		name = name.split(':')[1];
	}

	return {
		name,
		path: component
	};
}


/**
 * Build everything
 */
gulp.task('build', gulp.series(
	'build/deps',
	'build/components',
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
 * Update selenium webdriver
 */
gulp.task('webdriver/update', function () {
	const proc = spawn(
		process.platform === 'win32' ? 'node_modules\\.bin\\webdriver-manager' : 'node_modules/.bin/webdriver-manager',
		['update']
	);

	proc.stdout.pipe(split()).on('data', (line) => {
		console.log(line);
	});
	proc.stderr.pipe(split()).on('data', (line) => {
		console.log(line);
	});

	return proc;
});

/**
 * Run E2E tests locally on Chrome:
 * 1. Build the app
 * 2. Update selenium webdriver
 * 3. Start webserver
 * 4. Run tests
 */
gulp.task('test/e2e', gulp.series(
	gulp.parallel(
		'build',
		'webdriver/update'
	),
	function test(done) {
		// We do not want conflicts with other ports.
		// We also do not want to open the app in the browser as Protractor will do that for us.
		// And we don't want any notifications from BS.
		const port = 3010;
		bs.init(Object.assign({}, BS_CONFIG, {port, open: false, notify: false}), () => {
			const proc = spawn(
				process.platform === 'win32' ? 'node_modules\\.bin\\protractor' : 'node_modules/.bin/protractor',
				[
					'protractor.config.js',
					'--baseUrl',
					`http://localhost:${port}`
				]
			);

			proc.stdout.pipe(split()).on('data', (line) => {
				console.log(line);
			});
			proc.stderr.pipe(split()).on('data', (line) => {
				console.log(line);
			});

			proc.on('close', (error) => {
				if (error) {
					// Let gulp know that the tests failed
					done(new Error('Some specs have failed.'));
				} else {
					done();
				}
				process.exit(error);
				bs.exit();
			});
		});
	}
));


/**
 * Start server and open app in browser
 */
gulp.task('serve', gulp.series(
	'build',
	function start() {
		// Start watching files for changes
		gulp.watch('jspm.config.js', gulp.task('build/deps'));
		gulp.watch('components.config.json', gulp.task('build/components'));
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
