SystemJS.config({
	production: false,
	productionConfig: {},
	browserConfig: {
		"baseURL": "/"
	},
	paths: {
		"github:": "jspm_packages/github/",
		"npm:": "jspm_packages/npm/"
	},
	map: {
		"modules.config": "./modules.config.js"
	},
	packages: {
		"app": {
			"map": {
				"./env": {
					"~production": "./env.dev"
				}
			}
		}
	}
});

SystemJS.config({
	packageConfigPaths: [
		"github:*/*.json",
		"npm:@*/*.json",
		"npm:*.json"
	],
	map: {
		"decaf-common": "github:biosustain/decaf-frontend-common@master",
		"css": "github:systemjs/plugin-css@0.1.23",
		"angular": "github:angular/bower-angular@1.5.7",
		"angular-material": "github:angular/bower-material@1.0.9",
		"angular-ui-router": "github:angular-ui/angular-ui-router-bower@0.3.1"
	},
	packages: {
		"github:angular/bower-material@1.0.9": {
			"map": {
				"css": "github:systemjs/plugin-css@0.1.23",
				"angular-aria": "github:angular/bower-angular-aria@1.5.7",
				"angular-animate": "github:angular/bower-angular-animate@1.5.7",
				"angular": "github:angular/bower-angular@1.5.7"
			}
		},
		"github:angular/bower-angular-aria@1.5.7": {
			"map": {
				"angular": "github:angular/bower-angular@1.5.7"
			}
		},
		"github:angular/bower-angular-animate@1.5.7": {
			"map": {
				"angular": "github:angular/bower-angular@1.5.7"
			}
		},
		"github:angular-ui/angular-ui-router-bower@0.3.1": {
			"map": {
				"angular": "github:angular/bower-angular@1.5.7"
			}
		}
	}
});
