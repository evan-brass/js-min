import LiveData from "./live-data.mjs";

async function* use_case_one() {
    const count = new LiveData();
    yield* html`
        <button ${on('click', () => count.value -= 1)}>-</button>
        ${count}
        <button ${on('click', () => count.value += 1)}>+</button>
    `;
}


function* range(start, end, step = 1) {
    for (let i = start; i < end; i += step) {
        yield i;
    }
}
function comboLock() {
    let rotationDegrees = new LiveData();
    const NumbersOnDial = 20;
    const passcode = [1,2,3,4];
    const guess = passcode.map(() => false);
    symbols = Array.from(range(1, NumbersOnDial));
    return html`
        <main
            ${function(part){
                // Create a closure so that all these events have access to the touchMap
                const touchMap = new Map();
                on('touchstart', e => {
                    e.preventDefault(); e.stopPropagation();
                    for (const touch of e.changedTouches) {
                        touchMap.set(touch.identifier, touch.clientY);
                    }
                })(part);
                on('touchmove', e => {
                    e.preventDefault(); e.stopPropagation();
                    let diff = 0;
                    for (const touch of e.changedTouches) {
                        diff += touch.clientY - touchMap.get(touch.identifier);
                    }
                    rotationDegrees.value += diff;
                })(part);
                on('touchend', e => {
                    e.preventDefault(); e.stopPropagation();
                    for (const touch of e.changedTouches) {
                        touchMap.delete(touch.identifier);
                    }
                })(part);
            }}
            ${on('wheel', e => {
                const Scaler = .5;
                rotationDegrees.value += e.deltaY * Scaler;
            })}
        >
            <h1>Clue #3</h1>
            <div class="marker">^</div>
            <div class="dial-placeholder">
                <div class="dial" style="">
                    ${symbols.map((num, index) => {
                        html`<div style="
                            transform: translate(-50%) rotateZ(${index * 360 / NumbersOnDial})
                        ">${num}</div>`
                    })}
                </div>
            </div>
            <div class="digits">${async function*() {
                let direction;
                for await(const diff of (async function*() {
                    let last_degrees = false;
                    for await(const degrees of rotationDegrees) {
                        if (last_degrees) {
                            yield rotationDegrees - last_degrees;
                        }
                        last_degrees = degrees;
                    }
                })()) {
                    if (!direction && diff != 0) {
                        direction = diff;
                        continue;
                    }
                    if ((diff > 0 && direction < 0) || (diff < 0 && direction > 0)) {
                        // confirm the last digit
                        direction = diff;
                    }

                }
            }}</div>
            <p class="secret-message"><p>
        </main>
    `;
}

let last_touch_y;
const touchmove_handler = e => {
	e.preventDefault();
	e.stopPropagation();
	const Scaler = .5;
	const diff = last_touch_y ? e.touches[0].clientY - last_touch_y : 0;
	last_touch_y = e.touches[0].clientY;
	dial_degrees += diff * Scaler;
	update_digit();
};
const touchstart_handler = e => {
	e.preventDefault();
	e.stopPropagation();
	last_touch_y = false;
};

function create_dial() {
	dial = document.createElement('div');
	dial.classList.add('dial');
	for (let i = 1; i <= NumbersOnDial; ++i) {
		const number = document.createElement('span');
		number.innerText = i;
		number.style.transform = `translateX(-50%) rotateZ(${(i-1)*360/NumbersOnDial}deg)`
		dial.appendChild(number);
	}
	document.body.querySelector('.dial-placeholder').replaceWith(dial);

	digit_holder = document.body.querySelector('.digits');
	passcode.forEach(_ => {
		const digit = document.createElement('span');
		digits.push(digit);
		digit_holder.appendChild(digit);
	})
}