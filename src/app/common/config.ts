import {module} from 'angular';
import MODULES_CONFIG from 'modules.config';


const config = module('config', []);

config.service('modulesConfig', class ModulesConfig {
	config = MODULES_CONFIG;
	configForModule(moduleName) {
		return this.config.find(({name}) => name === moduleName);
	}
});

export default config;
