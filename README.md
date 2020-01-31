# js-min
js-min is for templating and reactivity with a little bit of glue.  js-min is for experimenting with alternatives and not for production use.  

## Features:
- Template Literals: Uses template literals for html and css.
  - Template Elements: Template literals are mapped to HTML Template elements making them fast to clone
- No VDOM: Expressions in the template literals (I call them "users" or "part users") have direct access to the dom and are responsible for any reactivity.

## Licensing:
This code is split licensed.  Everything inside the src folder was written by me and placed into the public domain via the unlicense.  The examples folder, however, may have dependencies and so I've decided to not figure out the licensing for them.

As always, this code is not intended to be used in production, it is just an experiment.  Feel free to fork it and make it your own.

## Design:
This is a response to lit-html.  I love the idea of using JS to build abstractions but I never feel comfortable if I know that those abstractions result in worse performance than if I'd written the code they run myself.  Because of this, I don't want to combine templating and reactivity into the same thing which is what most JS frameworks do today.  lit-html has a render function, a lot of other libraries have VDOM.  Instead what I wanted was something which extracts the whole "build dom -> extract references to important elements -> manipulate those elements" process that I've found in the custom-element code that I've written.

### Interfaces - Templating:
There are a few interfaces (I call them traits) that interact with eachother to build the templating.

#### Parts:
Parts are things that represent parts of the DOM.  Currently there are node, attribute, attribute-value, and style parts.  Each part is interacted with a little bit differently.  Node, attribute-value, and style parts are meant to be used using the update and clear methods.  The attribute part is unusual in that it has no update and clear definition and instead you access the element that the attribute was defined on using it's element property.  Attribute parts are what let us define event listeners, or us ref to get a reference to the element itself.  Attribute has no clear because it doesn't know what we've done to the element so it is our responsibility (as a user) to cleanup and uphold the expected lifecycle.  This usually isn't hard and naturally works with the addEventListener and removeEventListener type interfaces that web APIs have.

#### Users:
js-min includes a bunch of users by default.  I intend to fix this in the future, but it also has a function that converts just about anything into a user automatically: arrays, strings, numbers, elements, etc.  Users have a simple interface with an acceptTypes property, bind method, and unbind method. AcceptTypes is a JS Set of the types of parts that this user can be bound to.  This makes sure that something that expects to be bound to an attribute-part doesn't get bound to a node-part for example.  Event listeners can't be bound to blank spaces for example.  The Bind and Unbind functions constitute the user lifecyle.  You can control the part that you (as a user) are bound to until it is unbound from you (at which point you clean-up).  Pretty simple.

#### Swappable:
There is a slight optimization (which I think is broken after some of my refactoring) which is used to limit the amount of bind and unbinds.  Currently there's only one type of user that implements it which is the template-instance user.  What swappable does is give the currently bound part a chance to see the next value that will be bound to that part and then it can choose to perform the unbind-bind on it's own.  If for example I was replacing a template representing an HTMLButton with "Hello World" with another template instance that represented an HTMLButton with "Goodbye World" then it can leave the button alone and only unbind-bund the sub user which controls the text of the button.  Swapping doesn't come up very often (you almost have to intentionally come up with cases for it) but it can mean substantial savings when used.  You can think of it as a special case of dom-diffing even though it's very different.  A case where swapping might come up would be in removing an item from an array of items.  Swapping would move the items up rather than removing the node.  I'd like to add better control of swapping in the future.

#### Returnable:
Returnable is pretty simple, it is just a way of node-parts getting some HTML from a user and then returning that html when it is replaced with a new user.  This means that the fragment of dom doesn't have to be recreated in the future.  In the case of template-instance users they have to build a template element and then parse that template element's comment nodes to find where it's sub parts are and what kinds they are.  By returning the dom, the same user could be reused in the future without needing to reparse it.  It enables pooling template-instances.

---
# OLD:
#### Commentary:
Look at how the asyncy-bits make the control flow fairly easy to understand.  In the original version, it has the same red highlighting for when you get the passcode wrong, however you couldn't see it because events don't have state unless you're adding and removing them constantly or using scoped isLoading type variables.  I like that this puts its state into a code location rather than into event variables (mostly);
This was my first real test into how the framework is developing and whether or not it's still heading in what I believe is the right direction.  I think it is.  The parts that I'm a little concerned about are the whole Subject, LiveData, stuff.  I want all of the code to mostly feel like your code and for there to not really be any magic.  Those kindof feel like magic to me.  I also expected to be able to put more of the behavior in with the html and considered writing some sort of event to async generation function.  The problem with this is breaking information that comes from the framework out into the rest of the code.  It ended up having like an immediately invoked function to get the value out into the enclosing scope which felt off.  Instead I'm kinda pleased that the code within the dom is directly related to the dom: Events, simplified generation, etc.  Then the state machine controlling the interface is slightly bellow the html.  That seems proper to me.

## Ideas:
* Make as much computation frontload-able: template parsing, SSR, etc.
  * But have a gradiented path from "easy but slow" to "hard but fast".  In js-min, the template literal gets turned into a template element which get's instantiated (which requires parsing the comment nodes) into an instance which is then pooled automatically.  There should be a path for someone to precompute the template-literal -> template element conversion so that they can prime that cache with template elements in the SSR document or just from an innerHTML instead of the template literal.  I think that's pretty much how I would want to operate if I were writing that code by hand.
* Single, clear, template for both server-side and client-side rendering
  * This potentially constrains the backend to run JavaScript at some level to generate the rendered versions but I don't think that's too big of a deal.  I'm sure that there's a subset of JavaScript which could be transpiled to non-GC languages and then you could use them without JavaScript.  The goal is really to just have some single source of truth for how a component is generated so that there's no duplication or bugs.
* html template literals should be valid HTML: No on-event attributes
  * The string portions of the template literals should remain pure HTML.
  * Any higher functionality should be implemented using things like higher order functions that operate on the parts produced.
* lit-html style templating but without a render function
  * Instead, the values should be given access to the parts which in turn store enough information for their values to be changed.
* No virtual dom
  * A problem isn't solved by an abstraction until the abstraction is zero cost - that is, the abstraction should result in code as good or better than if you were to write it by hand.  If it doesn't do that then there must be some information that you have when you're programming that the abstraction doesn't know about and we should write a smarter abstraction.  If I was programming from scratch, I don't think I would ever spin up a DOM diffing solution.
* The library should fit well with and enable async function / async generator based state machines
  * A state machine can only be in one state at a time and an async function can be paused at only one spot at a time.
  * Also, you can have a sub state machine within a state machine. Ex. Counter / Timer within a toaster.  Ex. Single page / tab of a multi-page / Multi-tab element.
  * That said, in my testing with using async functions / async generators as state machines I've found a few instances where the state shouldn't be stored in purely a code location.  An example was a component which needed to know a degree value.  While this degree value is technically part of the state, it should be stored in a variable - potentially part of a closure.
  * This is how I want to write my web code in the future so it should fit well within that.
* Should work seamlessly inside a custom element structure
  * This likely means writing a custom element base class that uses the library.  That's the only way I know of to make sure that it works well with it.  I've tried just jumping in to writing a custom element base class using some of these ideas and it was miserably complex.  This time I want to solidify each idea independently before trying to put them all together.  CEs need templating and state management.  I believe that this templating system is going to be good for that and that the live-data and similiar systems would work for making reactive components.  I've looked into Directed Acyclic Graph, observable/stream/async-generator based reactive systems and still don't know what to use where.  Because of that I think that the best thing to do is to make it so that the state management is decoupled from templating.  Then later on when the CE base class is underway, it might make sense to unify them together or create multiple classes based on what style of reactivity they have.  One thing I'm very not convinced of is that top down data flow is the way to go.  Most things are not top-down including things like the select element which has child option elements and derives it's selected value from them.  As much as time travel debugging sounds cool, I think there must be a better way.  I'm hoping that state machines are clean enough and the browser tooling for async generator functions is clear enough to debug things easily.  As for remote debugging, maybe there's a way doing browser magic to get a dump of the trace and the values in all the scopes that the state machines have access to.  It also means that live reloading isn't so easy and debugging isn't so easy but I just think there has to be a good way of doing it and I hope to explore it some time.
* Preferably loosly coupled components so that it can be forked / customized / professionalized
  * Up front: This repository isn't going to be production ready.  Ever.  But it's real goal is to show patterns and implementations of those patterns which might be able to be forked into something worthwhile.
* Simple components that use browser features as effeciently / intelligently
  * Always prefer using the platform instead of creating a new one.  *Cough *cough - I hate VDOM - cough cough.
* Respect the end user's computing and memory resources while providing a good developer experience
  * Use zero cost abstractions and make a system that - though it might not do it at first (might need transpilation or more complex coding) - utilizes the functionality in the browser like the pre-fetch family of meta tags or service worker or CSP or anything else.  Everything should be designed in a way that would fit well with the existing APIs.

### Things I think you should note about the framework:
1. Notice how the templating works:

By using comment elements to store the part information, the browser does a single tree traversal to get those comments instead of an unknown number of tree traversals that happen when using multiple calls to querySelector or its relatives.  Query selector was my go too when coding by hand so it's good to know that this can be more efficient than that.

2. Notice how the entire work of the Template could be done server side and sent to the browser.

You could place template elements that already have the markers parsed in the document that you serve and then have a function which primes the template cache using those template elements.  I also want to get rid of the Text element based before and after and leave it as comments so that the instance could boot from a server side rendered template.

3. Notice how the html function template-tag creates a new Instance every time it's called.

One of the previous attempts I had at building this made the html function return an async generator that polled all of it's expressions.  How does that compare to the Instance.User interface?  Do your use cases work well or not with that interface?

The Instance class keeps a pool (well, I haven't tested that yet) of instances because of this problem.  Can you think of a way which wouldn't need to constantly create new instances?

If you were writing the html template tag how would you write it?  Please let me know!

4. Notice how the interfaces are defined using symbols.

Just like the well known symbols Symbol.iterator or Symbol.asyncIterator define interfaces, the User and Returnable interfaces are implemented.  I've become really fond of this style.  When it comes to implementing an interface for an object you have the freedom of the getter to potentially return an entirely different object.  This conjures for me pictures of Rust's very pretty type system and the way that they do iteration.

5. Think about how you would supply data to feed into the parts.

Would you use the LiveData class (which is modelled almost exactly like the live data class on Android)?  What about using a directed acyclic graph (DAG) of dependencies to propagate updates?  What about global store reducers?  What about using state machines?

6. What kinds of Users would you need for you project.

Like the "on" function which puts event listeners on attribute parts, what kinds of Users would you need?  Do you need Two way data binding?  What about one way?  How easy or hard would it be to implement those using the existing framework?

What about functions that take an array of elements and put them into a part?  What about a generator of elements?  What about an async generator of parts that maybe shows a loading bar at the bottom until the whole thing is loaded?

7. Lastly, think about how the async generator based component works.

Do you find the async generator implementation easy to understand?  It's a kind of state machine.  The current state is represented by await points.  Just like a Promise is a state machine with 'pending', 'resolved', and 'rejected' states, any async function is a state machine.  The state that the function is in can be thought of as the location of the await key word.  Just like a state machine can be in a single state at any one time, so the function can only be waiting at one await location at a time.

The last point is one I'm really excited about.  I don't fully understand it, but I think that using async generators is a clear way to build state machines.  There's plenty of challenges though.  Unlike safe args in android or the state machine libraries, the interface to the state machine is lacking.  I really like the idea of not using event listeners though and using async generators to handle events.  In my testing though, it get's really messy with having to join multiple possible events together and then figure out which one happend so that you can make the correct state change.

I wish you happy coding, let me know if you want to chat about any of the things here.  Many of the people I meet don't like my favorite language.  Let's talk JavaScript.