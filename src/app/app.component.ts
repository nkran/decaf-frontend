import {module} from 'angular';
import 'angular-material';
import 'angular-ui-router';
// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {sharing, project, config, Config} from 'decaf-common';
import MODULES_CONFIG from 'modules.config';

import {isProd} from './env';

import home from './components/home/home.component';
import login from './components/login/login.component';


const CORE_COMPONENTS = [
	// Angular
	'ngAnimate',
	'ngAria',
	'ngMaterial',
	// 3rd Party
	'ui.router'
];

const COMMON = [
	sharing.name,
	config.name,
	project.name
];

const APP_COMPONENTS = [
	login.name,
	home.name
];

const app = module('platform', [].concat(
	CORE_COMPONENTS,
	COMMON,
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

	constructor($rootScope, $window, private config: Config) {
		// Set title
		// 1. Set document title
		// 2. Set toolbar title
		// 3. Update the config with the module config (gives the module access to it's config from the platform modules.config.json)
		$rootScope.$on('$stateChangeSuccess', (previousRoute, currentRoute) => {
			let {module = null} = currentRoute.data || {};
			if (module) {
				this.module = MODULES_CONFIG.find(({name}) => name === module);
				if (this.module) {
					let {label} = this.module.navigation;
					$window.document.title = `Platform – ${label}`;
					// Turn of WS inspection for TS
					// noinspection TypeScriptUnresolvedFunction
					config.set('module', this.module);
				}
			} else {
				$window.document.title = 'Platform';
				this.module = null;
				// Turn of WS inspection for TS
				// noinspection TypeScriptUnresolvedFunction
				config.set('module', null);
			}
		});
	}

	// Update color from config
	get color() {
		// Turn off WS inspection for this
		// noinspection TypeScriptUnresolvedFunction
		return this.config.get('color');
	}

	modulesWithoutProjects() {
		return this.modules.filter(({isProjectType}) => !isProjectType)
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
		'toolbar': '?appToolbar'
	},
	template: `
		<div layout="row" flex ui-view="root">
			<md-sidenav layout="column" class="md-sidenav-left md-whiteframe-z2" md-component-id="left" md-is-locked-open="$mdMedia('gt-sm')">
				<project-nav modules="app.modules" project="app.project" color="app.color || app.module.color"></project-nav>
				<div ng-transclude="navigation"></div>
				<div ui-view="navigation"></div>
				<md-divider ng-if="app.modules.length"></md-divider>
				<md-list>
					<md-list-item ng-repeat="module in ::app.modulesWithoutProjects()" ui-sref="{{module.navigation.state}}">
						<md-icon>{{ module.navigation.icon }}</md-icon>
						<p>{{ module.navigation.label }}</p>
					</md-list-item>
				</md-list>
			</md-sidenav>
			<div layout="column" flex id="content">
				<md-toolbar class="module-color" ng-style="{'background-color': app.color || app.project.color || app.module.color}">
					<div class="md-toolbar-tools" ui-view="toolbar">
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
