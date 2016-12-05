import * as angular from 'angular';
import 'gsklee/ngStorage';

const session = angular.module('session.services.api', ['ngStorage']);


export class Session {
	constructor(private $http, private $localStorage, private $rootScope) {
	};

	isAuthenticated() {
		return this.expires > new Date();
	};

	get expires() {
		if (this.$localStorage.sessionJWT) {
			try {
				return new Date(JSON.parse(atob(this.$localStorage.sessionJWT.split('.')[0])).exp * 1000);
			} catch (e) {
				return new Date(0);
			}
		} else {
			return new Date(0);
		}
	};

	authenticate(credentials) {
		return this.$http.post('https://iloop.dd-decaf.eu/api/auth', credentials)
			.then((response) => {
				this.$localStorage.sessionJWT = response.data.token;
				this.$rootScope.$broadcast('session:login');
			});
	};

	logout(next = null) {
		delete this.$localStorage.sessionJWT;
		this.$rootScope.$broadcast('session:logout', {next: next});
	}
}

session.service('Session', Session);
export default session;
