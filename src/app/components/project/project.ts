import {module as ngModule} from 'angular';
// Turn of WS TS inspection for the 'decaf-common' import.
// noinspection TypeScriptCheckImport
import {dirname} from 'decaf-common';
import './project.css!';
import projects, {Projects} from './projects';
import nav from './nav.component';

const project = ngModule('platform.project', [
	projects.name,
	nav.name
]);


project.config(function ($stateProvider) {
	$stateProvider
		.state('root.project', {
			abstract: true,
			url: '/project/{projectId:[0-9]+}',
			resolve: {
				project: ['$stateParams', 'projects', ($stateParams, projects: Projects<any>) => projects.byId($stateParams.projectId)]
			},
			onEnter(projects: Projects<any>, project) {
				projects.current(project);
			},
			onExit(projects: Projects<any>) {
				projects.current(null);
			}
		})
		.state('root.project.home', {
			url: '/',
			views: {
				'content@': {
					templateUrl: `${dirname(module.id)}/project.html`,
					controller: ProjectHomeController,
					controllerAs: 'project'
				}
			}
		});
});


class ProjectHomeController {
	constructor() {}
}

export default project;
