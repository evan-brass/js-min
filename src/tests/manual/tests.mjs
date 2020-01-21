// @flow

import mount from '../../mount.mjs';

import dial from './dial.mjs';
import nodeArrayTest from './node-array.mjs';
import swappingTest from './swapping.mjs';
import homework from './homework.mjs';
import cssTest from './css.mjs';
import svgTest from './svg.mjs';
import basicTests from './basic.mjs';
import asyncGenTest from './async-generator.mjs';
import computedTest from './computed.mjs';
import calendarTest from './calendar.mjs';
import languageTesting from './language-testing.mjs';
import arrayPerformanceTest from './array-performance.mjs';
import sudoku from './sudoku.mjs';

const tests = [
	sudoku(),
	// languageTesting(),
	calendarTest(),
	arrayPerformanceTest(),
	computedTest(),
	nodeArrayTest(),
	dial(),
	swappingTest(),
	homework(),
	cssTest(),
	svgTest(),
	basicTests,
	asyncGenTest()
];
for (const test of tests) {
	const instanceContainer = document.createElement('div');
	instanceContainer.classList.add('instance');
	// So... I would normally try and build the dom and then append it but to have style parts work correctly, I have to append and then bind which will mean that some changes will happen after the element has been placed into the dom.  Honestly, I've always done it because I assumed it would have better performance but I've never tried it so it would be worth a performance test.
	document.body.append(instanceContainer);
	mount(test, instanceContainer);
}