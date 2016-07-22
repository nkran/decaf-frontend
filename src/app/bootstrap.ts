// Never remove this import of `angular` from here.
// NOTE: the import form angular also makes the `angular` namespace available globally
import 'angular';

import app from './app.component';


angular.element(document).ready(() => {
	angular.bootstrap(document.documentElement, [app.name], {
		// Do not enable strict DI.
		// NOTE: If we use `{strictDi: true}` we will not be able to use DI with ES6 classes
		strictDi: false
	});
});
