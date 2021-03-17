# Why?
Code reduction.  Sending javascript is expensive so I want to use less of it.  This has always been a goal and I think I can ship less be focusing more on using function based interfaces instead of having object/method based interfaces.  That's the plan at least.

I love when you design something and then you think of a feature you want and then the solution for that feature almost falls out of the design.  Those moments are the best, though for me they are rare.  The previous templating system felt like that, but it also felt too complex.  There were also some things which it was easy to do and seemed logical, but where not zero cost.

The first example is the attribute value parts. I usually used them for classes, but that made the browser parse the string that I just concatonated.  I should have been using the classList api instead but attribute value parts made it easy to do it the other way.  So with the new version, that's no longer allowed.  Currently, the only possible locations are node and attribute.  Changing the value of an attribute is easy enough with an attribute part although piping that together with an async iterator may be more difficult than before.  Cutting out attribute value parts removes a lot of code.  It's not that I'm being lazy in removing it - the code for attribute values already worked - I'm preventing myself from being lazy in the future by removing a feature that I was abusing.

Remove part objects.  I decided I don't like how the parts had to mediate the changes between the users and the DOM.  There were a few to this: swapping, framing/unframing - which meant string updates didn't create a new text node, etc.  But it added more code, and I like the idea of just providing a kind string to the function to tell it what it is looking at.

I had a heard time with building extensibility into the previous system.  How do I let people choose to enable/disable fragment pooling?  What if people want to extend the expression2user function?  How can I add a debug overlay to the template instance? These were hard things.  What I want to try instead is to decouple things as best as I can and use higher order functions to create the default versions.  That way, if someone wanted to adjust it they could just write their own function with different parameters.  I hope that this will make this more extensible and these functions would be const expressions that could be compiled away - if there existed a good javascript compiler.

In keeping with using functions instead of objects, I thought I might be able to get rid of the bind/unbind semantics.  I don't think that will work, but instead of an unbind method I can pass an abortSignal into the user function.

I'd thought that laziness was good in something like this, but I'm thinking that the lack of control was a bad idea.  My new belief is that the templating layer should be eager and low level.  Laziness could be implemented better at a higher level where more program specific knowledge exists.

I'm quite pleased with the ergonomics of the existing templating library so I want to keep those almost identical.  Doing so will involve solving problems like async iterator support.

1. No more attribute-value location support
2. Remove the parts altogether
3. Reduce code size - simplify
4. Make extensibility / customizability natural
5. Use functions more than objects
6. Use abortSignals instead of bind/unbind
7. Run eagerly instead of lazily
8. Use descendant paths instead of comment node based instantiation.

# Invariants
This templating library most likely doesn't operate correctly if the following are broken.  If you have a better idea for how to do things that doesn't rely on these constraints, let me know.
## Valid Node Part Positions
There are two kinds of parts.  Atribute parts and Node parts.  And attribute is placed like an HTML attribute.  Node parts can be placed anywhere that both a Comment node and a Text node are permitted content.  Because the template literal is concatonated with a marker string (eg `a315e9b5cd42acee8-0`) text nodes must be permitted content.  These markers in the template element are then replaced with comment nodes which are further replaced with the actual content when the template is instantiated.  An important case that illustrates this problem is tables.  This is invalid:
```javascript
function row(index) {
	return html`<tr><td>${index}</td></tr>`;
}
mount(html`
	<h1>Heading</h1>
	<table>${[row(1), row(2)]}</table>
`);
```
The two template literals will be 
```html
<template>
	<tr>
		<td><!----></td>
	</tr>
</template>
<template>
	<h1>Heading</h1>
	<!---->
	<table></table>
</template>
```
The reason for this is that text nodes are not [permitted content](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table) as direct children of a table.  Thus the HTML is invalid and the browser's failure recovery kicks in.  In the case of Chrome, the comment gets moved before table instead of inside it.  That behavior is undefined (I believe) and cannot be relied upon.  It may vary between browsers and between versions of browsers.

You also can't put a node part within a style tag.

TODO: Offer an alternative.
* Concatonate the strings and call html manually instead of on the template literal?
* Write a children handler?

## Stable Identity: 
html returns a handler that replaces the temporary comment node with a DocumentFragment.  In order for it to remove the nodes that it's added from this fragment, it saves the firstChild and lastChild of the fragment before inserting it into the document.  These first and last elements can't be removed from the DOM or "moved".  The nodes are removed from the dom, and put back into a document fragment which is cached for use instead of recloning the template in the future.

This is invalid:
```javascript
mount(html`<header>
		<h1>Title</h1>
	</header>
	<p>...</p>
	<footer ${el => el.replaceWith(document.createElement('footer'))}></footer>`);
```
To fix this, we can add a new lastChild like so:
```javascript
mount(html`
	<header>
		<h1>Title</h1>
	</header>
	<p>...</p>
	<footer ${el => el.replaceWith(document.createElement('footer'))}></footer>
	<!---->
`);
```
While using a text node like a newline after the footer would also make the example valid, I don't recommend doing that because then you couldn't safely minify your templates.

To learn more, read the `abort` event listener that is added to the signal inside the html function.  That is where this constraint is relied upon.