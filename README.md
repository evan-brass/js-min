# js-min
js-min is for templating and reactivity with a little bit of glue.  js-min is for experimenting with alternatives and not for production use.  

## Features:
- Template Literals: Uses template literals for html and css.
  - Template Elements: Template literals are mapped to HTML Template elements making them fast to clone
- No VDOM: Expressions in the template literals (I call them "users" or "part users") have direct access to the dom and are responsible for any reactivity.

## Licensing:
This code is split licensed.  Everything inside the src folder was written by me and placed into the public domain via the unlicense.  The examples folder, however, may have dependencies and so I've decided to not figure out the licensing for them.

As always, this code is not intended to be used in production, it is just an experiment.  Feel free to fork it and make it your own.

## TODO:
* Make naming consistent / stop mixing camel and snake case