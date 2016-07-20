import {module as ngModule} from 'angular';
// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
import './home.component.css!';


const home = ngModule('platform.home', []);


home.config(function ($stateProvider) {
	$stateProvider.state('root.home', {
		url: '',
		views: {
			'content@': {
				templateUrl: `${dirname(module.id)}/home.html`,
				controller: HomeController,
				controllerAs: 'home'
			}
		}
	});
});


class HomeController {
	constructor() {}
}

export default home;
