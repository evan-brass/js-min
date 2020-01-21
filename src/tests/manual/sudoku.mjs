// @flow

import html from '../../html.mjs';
import LiveData from '../../reactivity/live-data.mjs';
import on from '../../users/on.mjs';
import css from '../../users/css.mjs';
import range from '../../lib/range.mjs';
import Computed from '../../reactivity/computed.mjs';

const _ = 0;
const puzzle = [
	5, 3, _,  _, 7, _,  _, _, _,
	6, _, _,  1, 9, 5,  _, _, _,
	_, 9, 8,  _, _, _,  _, 6, _,

	8, _, _,  _, 6, _,  _, _, 3,
	4, _, _,  8, _, 3,  _, _, 1,
	7, _, _,  _, 2, _,  _, _, 6,
	
	_, 6, _,  _, _, _,  2, 8, _,
	_, _, _,  4, 1, 9,  _, _, 5,
	_, _, _,  _, 8, _,  _, 7, 9
];

export default function sudoku() {
	// Initialize the solver's view of the sudoku puzzle:
	const board = Array.from(puzzle);

	// Initialize the player's view of the sudoku puzzle:
	const table = build_table();

	// Initialize 
	for (let i of range(0, (9*9))) {
		const [r, c] = i2rc(i);
		const item = board[i];
		const el = table.rows[r].cells[c];
		if (item) {
			el.innerText = item;
			// Mark the original numbers so that they can't be erased later on:
			el.classList.add('original');
		}
	}

	// Editing state:
	let current_number = 1;

	// Buttons for selecting which number to enter:
	const num_select_buttons = Array.from(range(1, 10)).map(num => {
		const button = document.createElement('button');
		if (num == current_number) {
			button.classList.add('active-number');
		}
		button.innerText = num;
		button.addEventListener('click', _ => {
			num_select_buttons[current_number - 1].classList.remove('active-number');
			button.classList.add('active-number');
			current_number = num;
		});
		return button;
	});

	// Actually placing numbers into the table:
	table.addEventListener('click', ({target}) => {
		if (target.matches('td:not(.original)')) {
			target.innerText = current_number;
		}
	});

	// Output + styles:
	return html`
	<div class="sudoku">
		${table}
		<div class="num-container">
			${num_select_buttons}
		</div>
	</div>
	${css`
		.sudoku {
			--accent-color: #000;
		}
		.sudoku table {
			border-collapse: collapse;
			margin: 0 auto;
		}
		.sudoku td {
			border: 1px solid #aaa;
			width: 2em;
			height: 2em;
			text-align: center;
			vertical-align: middle;
		}
		.sudoku td:nth-of-type(3n) {
			border-right: 2px solid var(--accent-color);
		}
		.sudoku td:nth-of-type(1) {
			border-left: 2px solid var(--accent-color);
		}
		.sudoku tr:nth-of-type(3n) {
			border-bottom: 2px solid var(--accent-color);
		}
		.sudoku tr:nth-of-type(1) {
			border-top: 2px solid var(--accent-color);
		}
		.sudoku .original {
			font-weight: bold;
		}
		.sudoku .num-container {
			text-align: center;
		}
		.sudoku .num-container button {
			width: 2em;
			height: 2em;
			margin: .3em;
			border-radius: 50%;
			border: none;
			outline: 0;
			background: none;
		}
		.sudoku .num-container .active-number {
			border: 2px solid var(--accent-color);
		}
	`}
	`;
}
// This just calls the function with the item and the index
function iter_cell(board, func) {
	for (let i = 0; i < (9*9); ++i) {
		func(board[i], i);
	}
}

// Move between index and row / column coordinates
function i2rc(index) {
	return [
		Math.floor(index / 9),
		index % 9
	];
}
function rc2i(row, column) {
	return 9 * row + column;
}

// Build a table with the right number of rows and columns.  No need to store references because I can index into the table using dom apis.
function build_table() {
	const table = document.createElement('table');
	const body = document.createElement('tbody');
	table.appendChild(body);
	for (let _ of range(0, 9)) {
		const row = document.createElement('tr');
		for (let _ of range(0, 9)) {
			const cell = document.createElement('td');
			cell.setAttribute('tabindex', '-1');
			row.appendChild(cell);
		}
		body.appendChild(row);
	}
	return table;
}