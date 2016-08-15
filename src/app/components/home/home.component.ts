// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
import './home.component.css!';


const home = angular.module('platform.home', []);


home.config(function ($stateProvider) {
	$stateProvider.state('root.home', {
		url: '',
		views: {
			'content@': {
				templateUrl: `${dirname(module.id)}/home.component.html`,
				controller: HomeController,
				controllerAs: 'home'
			}
		}
	});
});


class HomeController {}

export default home;
