import ObservableArray from '../../lib/observable-array.mjs';
import range from '../../lib/range.mjs';

const assert = chai.assert;

describe('Library', function() {
	describe('delay()', function() {

	});
	describe('Differed', function() {

	});
	describe('doInFrameOnce()', function() {

	});
	describe('LiveData', function() {

	});
	describe('ObservableArray', function() {
		let arr;
		const tests = {
			'.push(1,2,3)': {
				initial: [],
				run() {
					arr.proxy.push(1,2,3);
				},
				added: [
					[1, '0'],
					[2, '1'],
					[3, '2']
				],
				moved: [],
				removed: []
			},
			'.pop()': {
				initial: [1,2,3,4,5],
				run() {
					arr.proxy.pop();
				},
				added: [],
				moved: [],
				removed: [
					[5, '4']
				]
			},
		};
		for (const title in tests) {
			it(title, function() {
				const {run, added, moved, removed, initial} = tests[title];
				arr = new ObservableArray(initial);
				run();
				assert.deepEqual(Array.from(arr.added.entries()), added);
				assert.deepEqual(Array.from(arr.moved.entries()), moved);
				assert.deepEqual(Array.from(arr.removed.entries()), removed);
			});
		}
		/*
		function clear (){
			console.log(proxy.toString());
			console.log(`${added.size} Added; ${removed.size} Removed; ${moved.size} Moved`);
			added.clear();
			removed.clear();
			moved.clear();
		}

		proxy.pop();

		console.log('1 pop'); clear();

		proxy.splice(1, 0, 17, 12, 34, 9, 5);

		console.log('splice'); clear();

		proxy.sort();

		console.log('sort'); clear();
		*/
		/*
		const arr = new Proxy([1,2,3,4,5,6,7,8,9,10], {
			get(target, name) {
				console.log('get', name);
				return target[name];
			},
			set(target, name, value) {
				console.log('set', name, value);
				return target[name] = value;
			}
		});
		console.group('reverse');
		Array.prototype.reverse.call(arr);
		console.groupEnd();
		
		console.group('sort');
		Array.prototype.sort.call(arr, (a, b) => a - b);
		console.groupEnd();
		*/
	});
	describe('range()', function() {
		it('range(0, 5) == [0, 1, 2, 3, 4]', function() {
			assert.deepEqual(Array.from(range(0, 5)), [0, 1, 2, 3, 4]);
		});
		it('range(0, 5, 1) == [0, 1, 2, 3, 4]', function() {
			assert.deepEqual(Array.from(range(0, 5, 1)), [0, 1, 2, 3, 4]);
		});
		it('range(5, 0, -1) == [5, 4, 3, 2, 1]', function() {
			assert.deepEqual(Array.from(range(5, 0, -1)), [5, 4, 3, 2, 1]);
		});
		it('range(0, 2.5, 1) == [0, 1, 2]', function() {
			assert.deepEqual(Array.from(range(0, 2.5, 1)), [0, 1, 2]);
		});
	});
	describe('stringHash()', function() {

	});
	describe('Subject', function() {

	});
	describe('Trait', function() {

	});
});