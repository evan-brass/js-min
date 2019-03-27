# js-framework
This is my attempt at my own JavaScript framework.  The goals for this framework are as follows:

* Make as much of the framework's computation something that could be done beforehand.
* lit-html style templating but without a render function
* No virtual dom
* Hopefully async function / async generator based state machines
* Hopefully a custom element base class that brings all of this together
* Preferably loosly coupled components so that it can be forked / customized / professionalized
* Simple components that use browser features as effeciently / intelligently
* Respect the end user's computing and memory resources while providing a good developer experience

The current tests can be found here: [https://evan-brass.github.io/js-framework/test.html] 
The code that produces those examples can be found here: [https://github.com/evan-brass/js-framework/blob/master/test.html]

### Things I think you should note about the framework:
1. Notice how the templating works:
By using comment elements to store the part information, the browser does a single tree traversal to get those comments instead of an unknown number of tree traversal that happen from using multiple calls to querySelector or its relatives.
2. Notice how the entire work of the Template could be done server side and sent to the browser.
You could place template elements that already have the markers parsed in the document that you serve and then have a function which primes the template cache using those template elements.
3. Notice how the html function template-tag creates a new Instance every time it's called.
One of the previous attempts I had at building this make the html function return an async generator this polled all of it's expressions.  How does that compare to the Instance.PartUser interface?  How do your use cases work or not with that system.
4. Notice how the interfaces are defined using symbols.
Just like the well known symbols like Symbol.iterator or Symbol.asyncIterator define interfaces, the PartUser and Returnable interfaces are implemented.  I've become really fond of this style.  When it comes to implementing an interface for an object you have the freedom of the getter to potentially return an entirely different object.  This conjures for me pictures of Rust's very pretty type system and the way that they do iteration.
5. Think about how you would supply data to feed into the parts.
Would you use the LiveData class (which is modelled almost exactly like the live data class on android)?  What about using a directed acyclic graph (DAG) of dependencies to propagate updates?  What about global store reducers?  What about using state machines?
6. What kinds of PartUsers would you need for you project.
Like the "on" function which puts even listeners on attribute parts, what kinds of PartUsers would you need?  Do you need Two way data binding?  What about one way?  How easy or hard would it be to implement those using the existing framework?
7. Lastly, think about how the async generator based component works.
Do you find the async generator implementation easy to understand?  It's a kind of state machine.  The current state is represented by await points.  Just like a Promise is a state machine with 'pending', 'resolved', and 'rejected' states, any async function is a state machine.  The state that the function is in can be thought of as the location of the await key word.  Just like a state machine can be in a single state at any one time, so the function can only be waiting at one await location at a time.

The last point is one I'm really excited about.  I don't fully understand it, but I think that using async generators is a clear way to build state machines.  There's plenty of challenges though.  Unlike safe args in android or the state machine libraries, the interface to the state machine is lacking.  I really like the idea of not using event listeners though and using async generators to handle events.  In my testing though, it get's really messy with having to join multiple possible events together and then figure out which one happend so that you can make the correct state change.

I wish you happy coding, let me know if you want to chat about any of the things here.  Many of the people I meet don't like my favorite language.  Let's talk JavaScript.