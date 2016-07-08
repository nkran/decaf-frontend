import {
	bootstrap,
	element
} from 'angular';
import './app';


element(document).ready(() => {
	bootstrap(document.documentElement, ['iloop'], {
		strictDi: false
	});
});
