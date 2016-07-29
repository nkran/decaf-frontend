// Provide a CLI like interface.
// See https://github.com/yargs/yargs for more details.
const yargs = require('yargs');

// Using Jasmine spec reporter
// See https://github.com/bcaudan/jasmine-spec-reporter/blob/master/docs/protractor-configuration.md for config.
const SpecReporter = require('jasmine-spec-reporter');

const argv = yargs
	.usage('Decaf Platform E2E test options.')
	.options({
		browsers: {
			describe: 'Comma separated list of preconfigured browsers to use.',
			default: 'CHROME_DESKTOP'
		}
	})
	.help('help')
	.wrap(40)
	.argv;

const BROWSER_CAPS = {
	CHROME_DESKTOP: {
		browserName: 'chrome',
		chromeOptions: {
			'args': ['--js-flags=--expose-gc'],
			'perfLoggingPrefs': {
				'traceCategories': 'v8,blink.console,disabled-by-default-devtools.timeline,devtools.timeline'
			}
		},
		loggingPrefs: {
			performance: 'ALL',
			browser: 'ALL'
		}
	}
};

const config = {};

if (process.env.TRAVIS) {
	Object.keys(BROWSER_CAPS).forEach((key) => {
		BROWSER_CAPS[key].build = `TRAVIS #${process.env.TRAVIS_BUILD_NUMBER} (${process.env.TRAVIS_BUILD_ID})`;
		BROWSER_CAPS[key]['tunnel-identifier'] = process.env.TRAVIS_JOB_NUMBER;
		BROWSER_CAPS[key].name = 'Decaf Platform - E2E';
	});

	// TODO: Setup Sauce Connect on Travis to run E2E tests in the CI env.
	// config.sauceUser = process.env.SAUCE_USERNAME;
	// config.sauceKey = process.env.SAUCE_ACCESS_KEY;
}

module.exports.config = Object.assign(config, {
	getPageTimeout: 120000,
	allScriptsTimeout: 120000,
	specs: ['e2e/**/*.spec.js'],
	multiCapabilities: argv.browsers.split(',').map((browser) => {
		const caps = BROWSER_CAPS[browser];
		console.log(`Testing against: ${browser}`);

		if (!caps) {
			throw new Error(`There is no browser with name "${browser};" configured.`);
		}

		return caps;
	}),
	framework: 'jasmine',
	jasmineNodeOpts: {
		color: true,
		defaultTimeoutInterval: 120000,
		// Remove protractor dot reporter
		print: function () {}
	},
	onPrepare: function () {
		// Add jasmine spec reporter
		jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'all'}));
	},
	plugins: [
		{
			package: 'protractor-console-plugin',
			failOnWarning: false,
			failOnError: true,
			logWarnings: true,
			exclude: [
				'info'
			]
		},
		{
			package: 'protractor-accessibility-plugin',
			chromeA11YDevTools: {
				treatWarningsAsFailures: true
			}
		}
	]
});
