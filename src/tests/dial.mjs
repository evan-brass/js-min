import {s, on} from '../expressions.mjs';
import html from '../min.mjs';
import range from '../range.mjs';
import { ArrayInstance } from '../instance.mjs';
import LiveData from '../live-data.mjs';

export default function dial(
    title = "Some Clue", 
    secretMessage = "This is secret", 
    symbols = Array.from(range(1, 10)), 
    passcode = [1,2,3,4]
) {
    const degrees = new LiveData();
    degrees.value = 0;
    const digits = passcode.map(_ => new LiveData());

    return html`
    <section class="dial-container">
        <h1>${s(title)}</h1>
        <div class="marker">^</div>
        <div class="dial" style="transform: rotate(-${degrees}deg)">
            ${new ArrayInstance(symbols.map((sym, i) => 
                html`<span style="transform: translateX(-50%) rotateZ(${s((i)*360/symbols.length)}deg);">${s(sym)}</span>`
            ))}
        </div>
        <div class="digits">${new ArrayInstance(digits.map(num => 
            html`<span>${num}</span>`
        ))}</div>
        <p class="secret-message">${s(secretMessage)}</p>
        <link rel="stylesheet" href="./src/tests/dial.css"></style>
    </section>
    `;
}