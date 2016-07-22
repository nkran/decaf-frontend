// Never remove this import of `angular` from here.
// NOTE: the import form angular also makes the `angular` namespace available globally
import 'angular';

import app from './app.component';


angular.element(document).ready(() => {
	angular.bootstrap(document.documentElement, [app.name], {
		strictDi: false
	});
});
