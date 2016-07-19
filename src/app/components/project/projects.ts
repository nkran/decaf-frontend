import {module} from 'angular';


const projects = module('platform.project._projects', []);
class Projects<T> implements Iterable<T> {
	private _current: any = null;

	private _items: any[] = [
		{id: 0, name: 'Archimedes', color: '#5fc5ff'},
		{id: 1, name: 'Umbrella', color: '#03d671'},
		{id: 2, name: 'X', color: '#ff7f4d'},
		{id: 3, name: 'Zeus', color: '#ff4747'}
	];

	[Symbol.iterator](): Iterator<T> {
		return this._items.entries();
	}

	byId(id) {
		return this.toArray().find((project) => (<any>project).id == id);
	}

	current(project?: any) {
		if (project !== undefined) {
			let {id = null} = project || {};
			return this._current = this.byId(id);
		}

		return this._current;
	}

	toArray(): T[] {
		return this._items;
	}
}

projects.service('projects', Projects);
export {Projects};


export default projects;
