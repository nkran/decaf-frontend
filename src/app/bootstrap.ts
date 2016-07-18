import {
	bootstrap,
	element
} from 'angular';
import app from './app.component';


element(document).ready(() => {
	bootstrap(document.documentElement, [app.name], {
		strictDi: false
	});
});
