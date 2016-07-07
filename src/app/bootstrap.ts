import {
	bootstrap,
	element
} from 'angular';
import 'angular-material';
import './app';


element(document).ready(() => {
	bootstrap(document.documentElement, ['iloop'], {
		strictDi: false
	});
});
