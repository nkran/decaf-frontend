// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
import 'angular-ui-router';
import Session from './session.component';
import './login.component.css!';

console.log(Session.name);

const login = angular.module('platform.login', [
	Session.name, 'ui.router'
]);


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

	constructor(private Session, private $state) {
		this.credentials = {
			username: '',
			password: ''
		};
	}

	public async authenticate(form, credentials) {
		try {
			await this.Session.authenticate(credentials);
			this.$state.go('root.home');
		} catch (invalidCredentials) {
			form.password.$setValidity('auth', false);
			form.$setPristine();
		}
	}

	public logout() {
		this.Session.logout();
	}

}

export default login;

