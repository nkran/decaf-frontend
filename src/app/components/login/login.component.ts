// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
// import Session from './session.component';
import './login.component.css!';


const login = angular.module('platform.login', []);


login.config(function ($stateProvider) {
	$stateProvider.state('root.auth', {
		url: '/login',
		views: {
			'root@': {
				templateUrl: `${dirname(module.id)}/login.component.html`,
				controller: LoginController,
				controllerAs: 'login'
			}
		}
	});
});


class LoginController {
	public credentials: any;

	constructor() {
		this.credentials = {
			username: '',
			password: ''
		};
	}

	public authenticate(form, credentials) : void {
		console.log('here');
	}

}

export default login;
