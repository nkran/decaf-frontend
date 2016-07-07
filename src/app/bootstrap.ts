import * as angular from 'angular';
import 'angular-material';
import './app';


angular.element(document).ready(() => {
	angular.bootstrap(document.documentElement, ['iloop'], {
		strictDi: false
	});
});
