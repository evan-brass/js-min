import User from './user.mjs';

// MAYBE: Switch to class?  So that those functions would be on a shared prototype?
export default function key_nav(handlers) {
	/* {
		left(target) {}, 
		right(target) {}, 
		up(target) {}, 
		down(target) {},
		space(target) {}
	} */
	const callback = e => {
		const { target, keyCode } = e;
		const code_to_handler = {
			37: 'left',
			39: 'right',
			38: 'up',
			40: 'down',
			32: 'space'
		};
		if (keyCode in code_to_handler) {
			handlers[code_to_handler[keyCode]](target);
			// I don't want the page to scroll if the up and down arrow keys are pressed.
			e.preventDefault();
		}
	};
    return {
        acceptTypes: new Set(['attribute']),
        get [User] () {
            return this;
        },
        bind(part) {
            part.element.addEventListener('keydown', callback);
        },
        unbind(part) {
            part.element.removeEventListener('keydown', callback);
        }
    };
}