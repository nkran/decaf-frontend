import 'angular-material';
import 'angular-ui-router';
import 'angular-route';

// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {sharing, core, project, config, Config} from 'decaf-common';

// Generated from `components.config.json`
import COMPONENTS_CONFIG from 'components.config';

import {isProd} from './env';

import home from './components/home/home.component';
import login from './components/login/login.component';
import ApiCallInterceptor from './components/login/interceptor.component';
import Session from './components/login/session.component';


const CORE_COMPONENTS = [
	// Angular
	'ngAnimate',
	'ngAria',
	'ngMaterial',
	'ngRoute',
	// 3rd Party
	'ui.router'
];

const COMMON = [
	sharing.name,
	config.name,
	project.name,
	core.name
];

const APP_COMPONENTS = [
	login.name,
	home.name
];

const app = angular.module('platform', [].concat(
	CORE_COMPONENTS,
	COMMON,
	COMPONENTS_CONFIG.map((component) => component.name),
	APP_COMPONENTS
));


// Production config
app.config(function ($httpProvider, $compileProvider) {
	// http://blog.thoughtram.io/angularjs/2015/01/14/exploring-angular-1.3-speed-up-with-applyAsync.html
	$httpProvider.useApplyAsync(true);
	if (isProd()) {
		// https://docs.angularjs.org/guide/production
		$compileProvider.debugInfoEnabled(false);
	}
	$httpProvider.interceptors.push(ApiCallInterceptor.Factory);
});


// AM theme config
app.config(function ($mdThemingProvider) {
	$mdThemingProvider
		.theme('default')
		.primaryPalette('blue-grey')
		.accentPalette('grey');

	$mdThemingProvider
		.theme('fullscreen')
		.primaryPalette('blue')
		.accentPalette('yellow')
		.backgroundPalette('blue-grey')
		.dark();
});

// Router config
app.config(function ($urlMatcherFactoryProvider, $urlRouterProvider, $stateProvider) {
	// Redirect to home no other route matched
	$urlRouterProvider.otherwise('/');

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
	components: any[] = COMPONENTS_CONFIG;
	component: any = null;

	constructor($rootScope, private $window, private config: Config, private Session) {
		// Set title
		// 1. Set document title
		// 2. Set toolbar title
		// 3. Update the config with the component config (gives the component access to it's config from the platform `components.config.json`)
		$rootScope.$on('$stateChangeSuccess', (previousRoute, currentRoute) => {
			let {component = null} = currentRoute.data || {};
			if (component) {
				this.component = COMPONENTS_CONFIG.find(({name}) => name === component);
				if (this.component) {
					let {label} = this.component.navigation;
					$window.document.title = `Platform – ${label}`;
					// Turn of WS inspection for TS
					// noinspection TypeScriptUnresolvedFunction
					config.set('componentConfig', this.component);
				}
			} else {
				$window.document.title = 'Platform';
				this.component = null;
				// Turn of WS inspection for TS
				// noinspection TypeScriptUnresolvedFunction
				config.set('componentConfig', null);
			}
		});
	}

	// Update color from config
	get color() {
		// Turn off WS inspection for this
		// noinspection TypeScriptUnresolvedFunction
		return this.config.get('color');
	}

	componentsWithoutProjects() {
		return this.components.filter(({isProjectType, authRequired}) =>
			!isProjectType &&
			(
				!authRequired || (authRequired && Boolean(this.Session.currentUser))
			)
		);
	}

	$onInit() {
		console.info(`App running in ${
			isProd() ? 'production' : 'dev'
		} mode.`);
	}

	logout() {
		this.Session.logout();
		this.$window.location.reload();
	};

	currentUser() {
		return this.Session.currentUser;
	};
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
			<!-- TODO: we need a menu icon that can open the sidebar when sidebar is hidden (small screen size) -->
			<md-sidenav layout="column" class="md-sidenav-left md-whiteframe-z2" md-component-id="left" md-is-locked-open="$mdMedia('gt-sm')">
				<project-nav components="app.components" project="app.project" color="app.color || app.component.color"></project-nav>
				<div ng-transclude="navigation"></div>
				<div ui-view="navigation"></div>
				<md-divider ng-if="app.components.length"></md-divider>
				<md-list>
					<md-list-item ui-sref="root.home">
						<md-icon md-menu-align-target>home</md-icon>
						<p>Home</p>
					</md-list-item>
					<md-divider></md-divider>
					<md-subheader class="md-no-sticky">Modules</md-subheader>
					<md-list-item ng-repeat="component in ::app.componentsWithoutProjects()" ui-sref="{{component.navigation.state}}">
						<md-icon>{{ component.navigation.icon }}</md-icon>
						<p>{{ component.navigation.label }}</p>
					</md-list-item>
					<md-divider></md-divider>
					<md-subheader class="md-no-sticky">External</md-subheader>
					<md-list-item href="https://iloop.dd-decaf.eu/">
						<md-icon md-svg-icon="/images/beaker-outline.svg"></md-icon>
						<p>ILoop</p>
					</md-list-item>
				</md-list>
			</md-sidenav>
			<div layout="column" flex id="content">
				<md-toolbar class="component-color" ng-style="{'background-color': app.component.color || app.project.color || app.color }">
					<div class="md-toolbar-tools" ui-view="toolbar">
						<h1 flex>
							{{app.component.navigation.label}}
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
