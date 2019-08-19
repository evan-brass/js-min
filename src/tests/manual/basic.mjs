import html from '../../html.mjs';
import ref from '../../users/ref.mjs';
import LiveData from '../../reactivity/live-data.mjs';
import on from '../../users/on.mjs';

const basicTests = [
	// Simple Test with Comment node
	html`
		<section class="${"a"} mixed with ${"b"} other things">
			<header ${ref(el => el)}>
				<h1>${"Text Location"}</h1>
			</header>
			<!-- Test user comments: } not; JSON' { -->
		</section>
	`,

	// Test if the marker get's lost when it's value doesn't match the attribute
	html`
		<form action="" method="">
			<select>
				<option selected="before ${''} after">Guts of an option</option>
			</select>
		</form>
	`,
	// Sample with event handlers
	(function(){
		const count = new LiveData();
		count.value = 10;
		return html`
			<button ${on('click', () => count.value -= 1)}>-</button>
			${count}
			<button ${on('click', () => count.value += 1)}>+</button>
		`;
	})(),

	// Troubleshooting a bug
	html`${'another'} ${'hello'}`,
];
export default basicTests;