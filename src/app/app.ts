import {module} from 'angular';
import 'angular-material';
import 'angular-ui-router';
import {isProd} from './env';
import MODULES_CONFIG from 'src/modules.config';


const CORE_COMPONENTS = [
	// Angular
	'ngAnimate',
	'ngAria',
	'ngMaterial',
	// 3rd Party
	'ui.router'
];

const app = module('iloop', [].concat(
	CORE_COMPONENTS,
	MODULES_CONFIG.map((module) => module.name)
));


// App configuration
app.config(function ($mdThemingProvider) {
	$mdThemingProvider
		.theme('default')
		.primaryPalette('blue-grey')
		.accentPalette('grey');
});


// Main component
class AppController {
	modules: any[] = MODULES_CONFIG;
	constructor() {}
	$onInit() {
		console.info(`App running in ${isProd() ? 'production' : 'dev'} mode.`);
	}
}

app.component('app', {
	bindings: {},
	controller: AppController,
	controllerAs: 'app',
	transclude: {
		'navigation': '?appNavigation',
		'header': 'appHeader'
	},
	template: `
		<div layout="column">
			<md-sidenav layout="column" class="md-sidenav-left md-whiteframe-z2">
				<div ng-transclude="navigation"></div>
				<md-list>	
					<md-list-item 
						ng-repeat="extension in ::app.extensions"
						ui-sref="{{ extension.navigation.state }}">
						<md-icon>{{ extension.navigation.icon }}</md-icon>
						<p>{{ extension.navigation.label }}</p>
					</md-list-item>
				</md-list>
			</md-sidenav>
			<div layout="column" flex id="content">
				<md-toolbar>
					<div class="md-toolbar-tools">
						<h1 flex>
							{{ app.module.name }}
						</h1>
						<div ng-transclude="header"></div>
					</div>
				</md-toolbar>
				<md-content layout="column" ui-view="content" flex></md-content>
			</div>
		</div>
	`
});


export default app;
