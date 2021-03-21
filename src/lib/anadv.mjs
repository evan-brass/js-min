// Argument Names And Default Values (ANADV.mjs)
// The goal of this function is to get the argument names and evaluate their  default values.
// It doesn't work on functions with a rest parameter and all arguments must have a default.
// You call it with the function whose arguments you want, and a function that grants it access to the scope where that function was defined.

// This code RELIES on eval and `with` - both of which are considered bad practice.  Run while you still can.
// While we're using eval, we are using it for it's true purpose: to execute outside code in a local scope.

// You should eval this variable to get the env_access function that you then pass to anadv
// By using `arguments`, we save introducing a named local variable that would mask the environment we're trying to grant access to.
export const env_access_src = `(function(){ return function env_access() {
	return eval(arguments[0]);
}; })()`;

// The default env_access function can only access global stuff.
// This function only works with non-anonymous functions, so no arrow functions.
// This function currently doesn't handle functions with a rest parameter in their argument list.
const different_eval = eval;
export function anadv(func, env_access = different_eval(env_access_src)) {
	const collect_names = window[Symbol.for('COLLECT_NAMES_FROM_CONTEXT')];

	// Get the function's source code (removing comments)
	let source = func.toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
	source = source.substr(source.indexOf('(') + 1);

	// Separate the arguments list
	// NOTE: The whole goal here is to not create a full JS parser, so we must accept that this may have bugs.
	// If you're going to use a JS parser then you wouldn't need this function.
	let rem = source;
	const stack = [')'];
	while (stack.length > 0) {
		let re;
		// Handle strings and stuff:
		if (stack[0] == '"' || stack[0] == "'") {
			// Find the " or ' preceeded by an odd (or zero) number of backslashes
			// But we have to double escape the backslashes here (once for the template literal and once for the regex string)
			re = new RegExp(`(?:^|[^\\\\])(?:\\\\\\\\)*${stack[0]}`, 'g');
		} else if (stack[0] == '`') {
			// Find the ` or ${ preceeded by an odd number of backslashes.
			re = /(?:^|[^\\])(?:\\\\)*`|(?:^|[^\\])(?:\\\\)*$\{/g;
		} else {
			re = /[`'"{([\])}]/g;
		}
		const result = re.exec(rem);
		if (result === null || re.lastIndex === 0) {
			throw new Error("Failed to parse args list.");
		}
		const token = rem[re.lastIndex - 1];
		rem = rem.substr(re.lastIndex);

		if (stack[0] == token) {
			stack.shift();
		} else {
			const opposite = { "'": "'", '"': '"', '`': '`', '(': ')', '{': '}', '[': ']' }[token];
			stack.unshift(opposite);
		}
	}
	// After the closing parenthesis, there should be the opening '{'
	if (!rem.match(/^\s*{/)) {
		throw new Error('Failed to parse args list.  Was this an arrow function?');
	}
	const args_source = source.substr(0, source.length - rem.length - 1);


	const [argument_names, target] = collect_names(args_source, env_access);
	const defaults = {};
	for (const key of argument_names) {
		defaults[key] = target[key];
	}

	return [argument_names, defaults];
}

// In order to use the `with` keyword, we need to be in sloppy mode.  Modules are always executed in "use strict"; so we need to create a regular script.
// collect_names places a proxy into the scope chain before evaling the arguments code.  The proxy will be consulted for all identifiers.  We use the env_getter to get the value that the identifier would have in the source environment.  Back in anadv, we can check if the identifier is defined (typeof id !== 'undefined').  All unidentified identifiers will be our argument names.  collect_names then returns the target.  We can index the target by our argument names to get their default values.
const collect_names_src = URL.createObjectURL(new Blob([`
const resolve = window[Symbol.for('COLLECT_NAMES_FROM_CONTEXT')];
window[Symbol.for('COLLECT_NAMES_FROM_CONTEXT')] = function collect_names(obscure_name_that_no_one_would_use, env_getter) {
	const arg_names = [], defaults = {};
	with (new Proxy({}, {
		get(target, prop_key) {
			if (prop_key == Symbol.unscopables) return {};
			arg_names.pop();
			return env_getter(prop_key);
		},
		has(target, prop_key) {
			if (!['obscure_name_that_no_one_would_use', 'eval'].includes(prop_key)) {
				arg_names.push(prop_key);
				return true;
			} else {
				return false;
			}
		},
		set(target, prop_key, value) {
			defaults[prop_key] = value;
			return Reflect.set(...arguments);
		}
	})) {
		eval(obscure_name_that_no_one_would_use);
	};

	return [arg_names, defaults];
};

resolve();
`], {
	type: "application/JavaScript"
}));
const script = document.createElement('script');
script.src = collect_names_src;
document.body.appendChild(script);


// Thanks to top-level await, we can pause this module until our script is evaluated.
await new Promise(resolve => window[Symbol.for('COLLECT_NAMES_FROM_CONTEXT')] = resolve);