import {module as ngModule} from 'angular';
// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
import './login.component.css!';


const login = ngModule('platform.login', []);


login.config(function ($stateProvider) {
	$stateProvider.state('root.auth', {
		url: '/login',
		views: {
			'root@': {
				templateUrl: `${dirname(module.id)}/login.component.html`,
				controller: LoginController,
				controllerAs: 'home'
			}
		}
	});
});


class LoginController {
	constructor() {}
}

export default login;
