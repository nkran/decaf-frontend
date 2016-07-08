import {module} from 'angular';
import './env';


const app = module('iloop', [
	// Angular
	'ngAnimate',
	'ngAria',
	'ngMaterial'
]);


// App configuration
app.config(function ($mdThemingProvider) {
	$mdThemingProvider
		.theme('default')
		.primaryPalette('blue-grey')
		.accentPalette('grey');
});


// Main component
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
					<!--<md-list-item -->
						<!--ng-repeat="extension in ::extensions"-->
						<!--ui-sref="{{ extension.navigation.state }}">-->
						<!--<md-icon>{{ extension.navigation.icon }}</md-icon>-->
						<!--<p>{{ extension.navigation.label }}</p>-->
					<!--</md-list-item>-->
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

class AppController {
	constructor() {
	}
}


export default app;
