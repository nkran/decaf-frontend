import {module as ngModule} from 'angular';
// import {dirname} from 'decaf-common';
// import './login.css!';


const nav = ngModule('platform.layout.project-nav', []);


class ProjectNavController {
	modules: any[];
	projects: any[];
	project: any;
	private _$state: any;

	constructor($state) {
		this._$state = $state;
		this.projects = this.modules.filter(({project}) => project);
	}

	switchTo(project) {
		const $state = this._$state;
		if (angular.equals(this.project, project)) {
			$state.go(project.navigation.state);
		} else {
			// Switch to a (different) project while staying in the same route.
			// Use the 'switchable' information on state.
			// Go up to nearest switchable state.
			if ($state.current.data && $state.current.data.switchable) {
				$state.go($state.current.data.switchable, {inherit: true});
			} else {
				$state.go(project.navigation.state);
			}
		}
	};
}

nav.component('projectNav', {
	bindings: {
		modules: '=',
		project: '=module',
		color: '='
	},
	controller: ProjectNavController,
	controllerAs: 'nav',
	template: `
		<md-toolbar ng-if="nav.projects.length" ng-style="{'background-color': nav.color}" class="module-color">
			<div class="md-toolbar-tools">
				<h1 flex>
					<a ng-if="nav.project" ui-sref="{{nav.project.navigation.state}}">{{nav.project.navigation.label}}</a>
					<span ng-if="!nav.project">Platform</span>
				</h1>

				<md-menu md-position-mode="target-right target">
					<md-button aria-label="More" class="md-icon-button" ng-click="$mdOpenMenu($event)">
						<md-icon>arrow_drop_down</md-icon>
					</md-button>
					<md-menu-content width="4">
						<md-menu-item ui-sref="root.home">
							<md-button>
								<div layout="row">
									<p flex>Home</p>
									<md-icon md-menu-align-target>home</md-icon>
								</div>
							</md-button>
						</md-menu-item>
						<md-menu-divider></md-menu-divider>
						<md-menu-item ng-repeat="project in nav.projects">
							<md-button ng-click="nav.switchTo(project)">
								<div layout="row">
									<p flex>{{project.navigation.label}}</p>
									<md-icon md-menu-align-target ng-style="{color: project.config.color}">folder</md-icon>
								</div>
							</md-button>
						</md-menu-item>
					</md-menu-content>
				</md-menu>
			</div>
		</md-toolbar>
	`
});


export default nav;
