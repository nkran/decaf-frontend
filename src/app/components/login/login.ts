import {module as ngModule} from 'angular';
import {dirname} from 'decaf-common';
import './login.css!';


const login = ngModule('platform.login', []);


login.config(function ($stateProvider) {
	$stateProvider.state('root.auth', {
		url: '/login',
		views: {
			'root@': {
				templateUrl: `${dirname(module.id)}/login.html`,
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
