# Templating:
The templating is based around two interfaces: Parts and Users (or part users).  A part represents a modifiable location in the DOM.  JS-Min has ~4 types of Parts that corrispond to potential DOM locations:
```html
<h1>
	{{ Node Parts }}
</h1>
<div {{ Attribute Parts }}>
	Content. Content.
</div>
<p class="col-3 {{ Attribute Value Parts }} dark">
	Content. Content.
</p>
<style>
	border: 1px solid {{ and Style Parts }};
</style>
```
The purpose of this templating library is to let you write Javascript template literals which bind to those parts, effectively turning code like this:
```javascript
const p = document.createElement('p');
p.innerHTML = `This is a tale about a great big button and it's adventure: <button class="big-btn">Click Me</button>`;
document.body.appendChild(p);
p.querySelector('button').addEventListener('click', console.log);
```
Into code like this:
```javascript
mount(html`
	<p>
		This is a tale about a great big button and it's adventure: <button ${on('click', console.log)} class="big-btn">Click Me</button>
	</p>
`, document.body);
```

## Phase 1: Template literal -> HTML Template
From:
```javascript
mount(html`
	<h1>
		${'Node Part'}
	</h1>
	<div ${ref(console.log)}>
		Content. Content.
	</div>
	<p class="col-3 ${'some-class'} ${'another-class'} dark">
		Content. Content.
	</p>
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="50" r="${50}"/>
	</svg>
`);
```
To:
```html
<template>
	<h1>
		ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-0
	</h1>
	<div ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-1="">
		Content. Content.
	</div>
	<p class="col-3 ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-2 ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-3 dark">
		Content. Content.
	</p>
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="50" r="ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-4"></circle>
	</svg>
</template>
```
The first step in going from the template literal to a template is to turn the array of strings that the html function receives into one big string that is valid html.  To do that we need to replace the template parts with something.  In the case of JS-Min, I call the strings that we put between markers and they are created as follows:
1. Concat all of the template strings with "{{}}" in place of all the parts
2. Take the SHA-1 hash of that string and get the hex representation of it
3. Create the template's ID from 'a' + the hex representation
4. For each marker take the template's ID and append '-' + i where i is an increasing number

A marker would end up looking like this: ae863033d0acb74a1e771919cd3a3fd688a075df6-0 or ae863033d0acb74a1e771919cd3a3fd688a075df6-1

Since the marker contains a hyphen and starts with a letter, it is valid html in all of the parts that we care about.  The cases where it isn't valid is in svg and style tags.  For css there is a seperate css template tag which you should use that handles this and more.  In the case of SVG, you might get warnings when building the template but once the markers get converted to comment nodes the SVG is valid.

To then build a template element, we create a template element and set it's innerHTML to the string we created.

## Phase 2: Markers -> Comment Nodes
From:
```html
<template>
	<h1>
		ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-0
	</h1>
	<div ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-1="">
		Content. Content.
	</div>
	<p class="col-3 ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-2 ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-3 dark">
		Content. Content.
	</p>
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="50" r="ad191ec51a81fcae353984db1ecd9fa04e9d6d9de-4"></circle>
	</svg>
</template>
```
To:
```html
<template>
	<h1>
		<!--{"type":"node","order":0}-->
	</h1>
	<!--{"parts":[{"type":"attribute","order":1}]}--><div>
		Content. Content.
	</div>
	<!--{"shared":[["col-3 ",""," ",""," dark"]],"parts":[{"type":"attribute-value","order":2,"attrName":"class","index":1,"sharedIndex":0},{"type":"attribute-value","order":3,"attrName":"class","index":3,"sharedIndex":0}]}--><p class="col-3   dark">
		Content. Content.
	</p>
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<!--{"shared":[[""]],"parts":[{"type":"attribute-value","order":4,"attrName":"r","index":0,"sharedIndex":0}]}--><circle cx="50" cy="50" r=""></circle>
	</svg>
</template>
```
The next step is to do a tree traversal of the template element looking for the markers.  When one is found it gets replaced with a comment node that represents the part that the marker represented.  The comment nodes have contents thare are JSON objects so that they are easy to parse later.  Node parts are pretty simple, but attribute and attribute value parts are more complex.
```json
{
	"shared": [
		[
			"col-3 ",
			"", 
			" ", 
			"", 
			" dark"
		]
	],
	"parts": [
		{
			"type": "attribute-value",
			"order": 2,
			"attrName": "class", // This is the name of the attribute that this part will be manipulating
			"index": 1, // This is the index of the string that this attribute value part will change within the shared array
			"sharedIndex": 0 // This is the index of which shared array to use, there's only one in this case
		},
		{
			"type": "attribute-value",
			"order": 3,
			"attrName": "class",
			"index": 3,
			"sharedIndex": 0
		}
	]
}
```
An attribute-value part - when updated - will change it's string within the shared array and then join the array together before using that as the value to set the attribute "attrName".