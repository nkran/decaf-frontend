import {module as ngModule} from 'angular';
// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
import projects, {Projects} from './projects';


const nav = ngModule('platform.project.nav', [
	projects.name
]);


class ProjectNavController {
	modules: any[];
	private _projects: Projects<any>;
	private _$state: any;

	constructor($scope, $state, projects: Projects<any>) {
		this._$state = $state;
		this._projects = projects;

		$scope.$watchCollection('nav._modules', (modules) => {
			if (modules) {
				this.modules = modules.filter(({isProjectType}) => isProjectType);
			}
		});
	}

	get projects() {
		return this._projects.toArray();
	}

	get project() {
		return this._projects.current();
	}

	switchTo({id}) {
		const $state = this._$state;
		if (this.project == id) {
			$state.go('root.project.home', {projectId: id});
		} else {
			// Switch to a (different) project while staying in the same route.
			// Use the 'switchable' information on state.
			// Go up to nearest switchable state.
			if ($state.current.data && $state.current.data.switchable) {
				$state.go($state.current.data.switchable, {projectId: id}, {inherit: true});
			} else {
				$state.go('root.project.home', {projectId: id});
			}
		}
	}
}

nav.component('projectNav', {
	templateUrl: `${dirname(module.id)}/nav.html`,
	controller: ProjectNavController,
	controllerAs: 'nav',
	bindings: {
		_modules: '=modules',
		color: '='
	}
});


export default nav;
