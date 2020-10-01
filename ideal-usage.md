# Counter:
```javascript
const count = use_data();
html`
	<button ${on('click', _ => count.value += 1)}>+</button>
	${count}
	<button ${on('click', _ => count.value -= 1)}>-</button>
`;
```
* The template literal is valid HTML
	* The event handlers are marked using a function
* Somehow count needs to be able to change the part that it's given

# TODO:
```javascript
const list = [];
let description;

html`
	<input type="text" ${el => description = el}>
	<button ${on('click', _ => list.push({ desc: description.value, done: false }))}>Create</button>
	<ul>
		${list.map((task, i) => html`
			<li>
				${}
				<button ${on('click', _ => list.splice(i, 1))}>X</button>
			</li>
		`)}
	</ul>
`;
```
