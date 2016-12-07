class ApiCallInterceptor implements angular.IInterceptor {
	public static Factory($injector: angular.auto.IInjectorService, $q: angular.IQService) {
		return new ApiCallInterceptor($injector, $q);
	};

	constructor(private $injector: angular.auto.IInjectorService, private $q: angular.IQService) {
	};

	public request = (requestSuccess): angular.IPromise<any> => {
		let $localStorage = this.$injector.get('$localStorage');
		if ($localStorage.sessionJWT) {
			requestSuccess.headers.Authorization = `Bearer ${$localStorage.sessionJWT}`;
		}
		return requestSuccess;
	};

	public responseError = (responseFailure): angular.IPromise<any> => {
		if (responseFailure.status === 401) {
			this.$injector.get('Session').logout(location.pathname);
		}
		return this.$q.reject(responseFailure);
	};
}

ApiCallInterceptor.Factory.$inject = ["$injector", "$q"];

export default ApiCallInterceptor;
