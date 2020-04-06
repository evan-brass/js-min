import css from '../../src/templating/css.mjs';

export default css`
	:host {
		direction: auto;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		grid-template-rows: auto auto repeat(6, auto minmax(1em, auto) minmax(1em, auto) minmax(1em, auto) minmax(1em, auto) minmax(1em, auto));
		border: 1px solid #aaa;
		border-bottom: 0;
		/*
			overflow-y: auto;
			overflow-x: hidden;
		*/
		/* display: layout(blocklike); */
	}
	header {
		display: flex;
		align-items: baseline;
		grid-column: auto / span 7;
	}
	.title {
		order: 0;
	}
	.displayed-month {
		order: 1;
	}
	.title, .displayed-month {
		margin: 0;
	}
	.displayed-month {

	}
	.title {
		flex-grow: 1;
	}
	.weekdays {
		/* Prevent languages with multi word weekday names (like hebrew) from wrapping before attempting to use a smaller weekday name format: */
		white-space: nowrap;
		display: contents;
		text-align: center;
	}
	.weekday {

	}
	.cells {
		display: contents;
	}
	.cell {
		/* I'm using negative margins to make colloring the outline of an element easier. TODO: Replace with a paint worklet? */
		box-sizing: border-box;
		grid-row: auto / span 6;
		border: 1px solid #aaa;
		margin: -1px -1px 0 0;
		outline: 0;
	}
	.cell.basis {
		z-index: 5;
		border-color: lime;
	}
	.cell:dir(ltr):nth-of-type(7n - 6),
	.cell:dir(rtl):nth-of-type(7n),
	/* Sadly, dir() isn't supported even in Canary so I need a js fallback that uses getComputedStyles(el).direction and applies a css class. */
	.ltr .cell:nth-of-type(7n - 6),
	.rtl .cell:nth-of-type(7n) {
		margin-left: -1px;
	}
	.cell:not(.in-month) {
		background-color: #ddd;
	}
`;