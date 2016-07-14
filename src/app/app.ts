import {module} from 'angular';
import 'angular-material';
import 'angular-ui-router';
import sharing from 'decaf-common';
import MODULES_CONFIG, {MODULES_DEPENDENCIES} from 'modules.config';

import {isProd} from './env';

import config from './common/config';

import home from './components/home/home';
import login from './components/login/login';


const CORE_COMPONENTS = [
	// Angular
	'ngAnimate',
	'ngAria',
	'ngMaterial',
	// 3rd Party
	'ui.router',
	// Biosustain
	sharing.name
];

const COMMON = [
	config.name
];

const APP_COMPONENTS = [
	home.name,
	login.name
];

const app = module('platform', [].concat(
	CORE_COMPONENTS,
	COMMON,
	MODULES_DEPENDENCIES.map((module) => module.name),
	MODULES_CONFIG.map((module) => module.name),
	APP_COMPONENTS
));


// AM theme config
app.config(function ($mdThemingProvider) {
	$mdThemingProvider
		.theme('default')
		.primaryPalette('blue-grey')
		.accentPalette('grey');
});

// Router config
app.config(function ($urlMatcherFactoryProvider, $stateProvider) {
	// Optional slash
	$urlMatcherFactoryProvider.strictMode(false);

	// Root state
	$stateProvider.state('root', {
		url: '',
		abstract: true
	});
});


// Main component
class AppController {
	modules: any[] = MODULES_CONFIG;
	module: any = null;
	constructor($rootScope, $window, modulesConfig) {
		// Set title
		// 1. Set document title
		// 2. Set toolbar title
		$rootScope.$on('$stateChangeSuccess', (previousRoute, currentRoute) => {
			let {module = null} = currentRoute.data || {};
			if (module) {
				this.module = modulesConfig.configForModule(module);
				if (this.module) {
					let {label }= this.module.navigation;
					$window.document.title = `Platform – ${label}`;
				}
			}
		});
	}
	$onInit() {
		console.info(`App running in ${
			isProd() ? 'production' : 'dev'
		} mode.`);
	}
}

app.component('app', {
	bindings: {},
	controller: AppController,
	controllerAs: 'app',
	transclude: {
		'navigation': '?appNavigation',
		'header': 'appToolbar'
	},
	template: `
		<div layout="row" flex ui-view="root">
			<md-sidenav layout="column" class="md-sidenav-left md-whiteframe-z2" md-component-id="left" md-is-locked-open="$mdMedia('gt-sm')">
				<div ng-transclude="navigation"></div>
				<div ui-view="navigation"></div>
				<md-list>
					<md-list-item ng-repeat="module in ::app.modules" ui-sref="{{module.navigation.state}}">
						<md-icon>{{ module.navigation.icon }}</md-icon>
						<p>{{ module.navigation.label }}</p>
					</md-list-item>
				</md-list>
			</md-sidenav>
			<div layout="column" flex id="content">
				<md-toolbar>
					<div class="md-toolbar-tools">
						<h1 flex>
							{{app.module.navigation.label}}
						</h1>
						<div ng-transclude="toolbar"></div>
					</div>
				</md-toolbar>
				<md-content layout="column"
							ui-view="content"
							flex>
				</md-content>
			</div>
		</div>
	`
});


export default app;
