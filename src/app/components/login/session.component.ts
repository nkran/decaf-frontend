import * as angular from 'angular';
import 'gsklee/ngStorage';

const session = angular.module('session.services.api', ['ngStorage']);


const API_ROOT = 'https://iloop.dd-decaf.eu/api';
const BIOSUSTAIN_API_ROOT = 'https://iloop.biosustain.dtu.dk/api';

export class Session {

	constructor(
		private $http,
		private $localStorage,
		private $rootScope,
		private $location
	) {};

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

	get currentUser() {
		return this.$localStorage.user;
	};

	authenticate(credentials) {
		let apiRoot = API_ROOT;
		if (this.$location.host().includes('cfb')) {
			apiRoot = BIOSUSTAIN_API_ROOT;
		}
		return this.$http.post(apiRoot + '/auth', credentials)
			.then((response) => {
				this.$localStorage.sessionJWT = response.data.token;
				this.$rootScope.$broadcast('session:login');
				this.$http.get(apiRoot + '/user/me').then((response) => {
					this.$localStorage.user = response.data;
				});
			});
	};

	logout(next = null) {
		delete this.$localStorage.sessionJWT;
		delete this.$localStorage.user;
		this.$rootScope.$broadcast('session:logout', {next: next});
	}
}

session.service('Session', Session);
export default session;
