import {module} from 'angular';


const projects = module('platform.project._projects', []);
class Projects<T> implements Iterator<T> {
	private _current: any = null;

	private _pointer = 0;
	private _items: any[] = [
		{id: 0, name: 'Archimedes', color: '#5fc5ff'},
		{id: 1, name: 'Umbrella', color: '#03d671'},
		{id: 2, name: 'X', color: '#ff7f4d'},
		{id: 3, name: 'Zeus', color: '#ff4747'}
	];

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
		return Array.from(this);
	}

	// Iteration
	// `for..of` and `.next()` iteration logic
	get length() {
		return this._items.length;
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this;
	}
	next(): IteratorResult<T> {
		if (this._pointer < this._items.length) {
			return {
				done: false,
				value: this._items[this._pointer++]
			};
		} else {
			this._pointer = 0;
			return {
				done: true,
				value: null
			};
		}
	}
}

projects.service('projects', Projects);
export {Projects};


export default projects;
