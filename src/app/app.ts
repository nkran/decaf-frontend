import * as angular from 'angular';
import './env';


const app = angular.module('iloop', [
	// Angular
	'ngAnimate',
	'ngAria',
	'ngMaterial'
]);


app.component('app', {
	bindings: {},
	controller: AppController,
	controllerAs: 'app',
	template: `<h1>Hello!</h1>`
});

class AppController {
	constructor() {
	}
}


export default app;
