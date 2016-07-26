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
* `{color}` (***Optional***) - Sets the color of the sidebar project navigation and the toolbar, alternatively this can also be set programmatically from within the component using `config.set('color', '<color>')`.
* `{isProjectType}` (***Optional***) - If set to `true`, the component will show up in the project navigation and it will be available to every project as a subroute of the project.
* `{navigation.state}` (***Mandatory***) - Sets the route at which the component is available.
If the component is not of project type, it will be available at the root, otherwise it will be a subroute of each of the projects.
Usually you set this to the root state that you configured within the module via `platformProvider.state()`.
Of course, you can also point to another state, but make sure you registered the state in one of your components via `platformProvider.state()`.
* `{navigation.label}` (***Mandatory***) - Set the name of the component (used for setting the document and the toolbar title, but also the label for the navigation item in the sidebar).
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
There are two kinds of components that can be used:
* [Project Component](https://github.com/biosustain/decaf-frontend-project-module-example)
* [Component](https://github.com/biosustain/decaf-frontend-module-example)

Both can be installed either by downloading it or cloning it (remember that cloning keeps commit history).

Afterwards, navigate to the root of the folder where you have the component (via the terminal) and run the following commands to install the runtime/dev deps:
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

In the above example, there are a few things that are important:
* `platformProvider.register(COMPONENT_NAME, {isProjectType: true})` - This is a mandatory action. You use that to register a component.
* `{isProjectType: true}` - You can use the second argument to configure the component, in this case it will tell the platform that this is a project component.
Note that you still need to specify the same `isProjectType` property in `components.config.json`.
* `dirname(module.id)` - This is just a helper to get the path for where the component resides, you should always use it.
* `platformProvider.state()` - This sets the states/routes for the component.
It is just a proxy to Angular UI Router's [$stateProvider.state()](http://angular-ui.github.io/ui-router/site/#/api/ui.router.state.$stateProvider), thus everything you'd configure with it, you also do it with the `platformProvider.state()`.

Note that the `{view}` property of the state contains the key `content@`.
That will be the entry point of the component markup when navigating to the component route or any subroutes of the component.
Besides `content@`, you also have the option to overide the toolbar by providing a view with the key `toolbar@`.


#### Sharing Data
If you wish to share data between components, you can use the `sharing` provider to do so.
Let's assume you have two components `foo` and `bar`, and you'd like for component `foo` to send some data to component `bar` when navigating from `foo` to `bar`.
In this scenario you'd have to setup component `foo` as it follows:
```js
import {Config, dirname} from 'decaf-common';


export const COMPONENT_NAME = 'foo';
const foo = angular.module(COMPONENT_NAME, []);


foo.config(function (platformProvider) {
	platformProvider
		.register(COMPONENT_NAME)
		.state(COMPONENT_NAME, {
			url: `/${COMPONENT_NAME}`,
			views: {
				'content@': {
					templateUrl: `${dirname(module.id)}/foo.component.html`,
					controller: FooComponentController,
					controllerAs: 'foo'
				}
			}
        });
});

class FooComponentController {
	data = [{
		carrots: 10
	}];

	constructor($scope, sharing) {
		sharing.provide($scope, {
		    // NOTE: The value for `{data}` points to property declared on this class, thus make sure that the
		    // `{controllerAs: '<name>'}` matches with `<name>.<property>`.
			data: 'foo.data'
		});
	}
}


export default foo;
```

And in oder to access the data sent from `foo`, `bar` would have the following setup:
```js
import {Config, dirname} from 'decaf-common';


export const COMPONENT_NAME = 'bar';
const bar = angular.module(COMPONENT_NAME, []);


bar.config(function (platformProvider) {
	platformProvider
		.register(COMPONENT_NAME, {
            sharing: {
                // NOTE: `'vegetables'` should match the property name that you declared in the componet `foo` from `{data: 'foo.vegetables'}`
                // {multiple: true} denotes that the component sent an Array.
                accept: [{type: 'vegetables', multiple: true}],
                // Use `{name}` to set the name of the item in the sharing menu
                name: 'Example Component'
            }
        })
		.state(COMPONENT_NAME, {
			url: `/${COMPONENT_NAME}`,
			views: {
				'content@': {
					templateUrl: `${dirname(module.id)}/bar.component.html`,
					controller: BarComponentController,
					controllerAs: 'bar'
				}
			}
        });
});

class BarComponentController {
	constructor(sharing) {
		const data = sharing.items('data');
	}
}


export default bar;
```


### Development
---------------
If you wish to build the app for production, use the `$(npm bin)/gulp build --production` task.

I also advise linting the source files before you commit, use `$(npm bin)/gulp lint`.

For other tasks run `$(npm bin)/gulp --tasks`.
