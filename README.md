# Decaf Platform
> A component based project starter.

### Installation
----------------
Download the [project](https://github.com/biosustain/decaf-frontend/archive/master.zip) or clone it `git clone git@github.com:biosustain/decaf-frontend.git`.

**NOTE**: Cloning this project will also keep all the commit history, so if you wish to start with a fresh commit history, I advise downloading it.

Install dev and runtime dependencies:
* `npm install`
* `$(npm bin)/typings install`


### Setup
---------
If you successfully setup the project using the steps above, you can run the app with `$(npm bin)/gulp serve`.

This is a component based app, so the sidebar navigation and the the app routes are generated from the `components.config.json` file at the root of the project.

**NOTE**: [JSPM](http://jspm.io/0.17-beta-guide/index.html) is used as package manager and for installing the components as well. Components can be simply a github project, a npm package or a JSPM package.
Therefore, the config file mentioned above is used for providing a reference to the component and some extra information about it. 

The file is a JSON with the following schema:
```js
{
    // Check https://github.com/jspm/jspm-cli/blob/master/docs/installing-packages.md
    // on how `<component>` should look like,
    // but basically it could be:
    // 1. github:<organization/username>/<repository>
    // 2. npm:<package name>
    // 2. <package name>
	"<component>": {
		"name": string,
		"color": string, 
		"isProjectType": boolean,
		"navigation": {
			"state": string, 
			"label": string,
			"icon": string 
		}
	}
}
```

Each of the above configuration properties should be configured as it follows:
* `{name}` (***Mandatory***) - It should be the same as `<component name>` you used in `platformProvider.register(<component name>)` within the component project.
* `{color}` (***Optional***) - Sets the color of the sidebar project navigation and the toolbar, alternatively this can also be set programmatically from within the component using `config.set('color', '<color>')`.
* `{isProjectType}` (***Optional***) - If set to `true`, the component will show up in the project navigation and it will be available to every project as a subroute of the project.
* `{navigation.state}` (***Mandatory***) - Sets the route at which the component is available.
If the component is not of project type, it will be available at the root, otherwise it will be a subroute of each of the projects.
This, like the `{name}` above, it should be the same as `<component name>` you used in `platformProvider.register(<component name>)` within the component project.
Of course, you can also point to another state, but make sure you registered the state in one of your components via `platformProvider.state()`.
* `{navigation.label}` (***Mandatory***) - Set the name of the component (used for setting the document and the toolbar title).
* `{navigation.icon}` (***Mandatory***) - Set the navigation icon for the component, see [Material Icons](https://design.google.com/icons/) for a list of icons.
Note that you should write them as snake case (e.g. `bug_report`).

Each component configuration will be available to the component as well. Access to the configuration is achieved through the `config` service:
```js
class FooController {
    constructor(config) {
        let componentConfig = config.get('componentConfig');
    }
}
```


#### Creating Components
------------------------
There are two kinds of components that can be used:
* [Project Component](https://github.com/biosustain/decaf-frontend-project-module-example)
* [Component](https://github.com/biosustain/decaf-frontend-module-example)

Both can be installed either by downloading it cloning it (remember that cloning keeps commit history).

Afterwards, navigate to the root of the component via the terminal and run the following commands to install runtime/dev deps:
* `npm install`
* `$(npm bin)/typings install`

Now you can run the component as a standalone app (for testing and developing) with `$(npm bin)/gulp serve`.

**NOTE**: See other tasks by running `$(npm bin)/gulp --tasks`.

You should only be working in the `src/` folder of the component and you should never remove `index.ts` unless you know what your're doing.

Furthermore, make sure you export the angular module as default from your component (name does not matter):
```js
// src/my-component.component.ts
import {dirname} from 'decaf-common';

export const COMPONENT_NAME = 'project-example';
const myComponent = angular.module(COMPONENT_NAME, []);


myComponent.config(function (platformProvider) {
	platformProvider
		.register(COMPONENT_NAME, {isProjectType: true})
		.state(COMPONENT_NAME, {
			url: `/${COMPONENT_NAME}`,
			views: {
				'content@': {
					templateUrl: `${dirname(module.id)}/my-component.component.html`,
					controller: MyComponentController,
					controllerAs: 'myComponent'
				}
			}
		});
});


class MyComponentController {
	constructor() {}
}

// Note the default export
export default myComponent;
```


### Development
---------------
If you wish to build the app for production, use the `$(npm bin)/gulp build --production` task.

I also advise linting the source files before you commit, use `$(npm bin)/gulp lint`.

For other tasks run `$(npm bin)/gulp --tasks`.
