import {s, on} from '../expressions.mjs';
import html from '../min.mjs';
import range from '../lib/range.mjs';
import { ArrayInstance } from '../instance.mjs';
import LiveData from '../lib/live-data.mjs';
import Subject from '../lib/subject.mjs';
import delay from '../lib/delay.mjs';
import { html_id } from '../min.mjs';

export default function dial(
    title = "Some Clue", 
    secretMessage = "This is secret", 
    symbols = Array.from(range(1, 10)), 
    passcode = [1,2,3,4]
) {
    const scrollDiffs = new Subject();
    const last_location = new Map()
    return html_id('a466ba70e', [on('wheel', e => {
            const Scaler = .5;
            scrollDiffs.yield(e.deltaY * Scaler);
            e.preventDefault();
        }),
        on('touchstart', e => {
            for (const touch of e.changedTouches) {
                last_location.set(touch.identifier, touch.clientY);
            }
            e.preventDefault();
        }),
        on('touchmove', e => {
            let diff = 0;
            for (let touch of e.changedTouches) {
                diff += touch.clientY - last_location.get(touch.identifier);
                last_location.set(touch.identifier, touch.clientY);
            }
            scrollDiffs.yield(diff);
            e.preventDefault();
        }),
        on('touchend', e => {
            for (const touch of e.changedTouches) {
                last_location.delete(touch.identifier);
            }
            e.preventDefault();
        }),
        s(title),
        (async function*() {
            const degrees = new LiveData();
            degrees.value = 0;
            const digits = passcode.map(_ => new LiveData());
            const digit_status = new LiveData();
            const secret_container = new LiveData();
            
            yield html_id('a64503b0c', [
                degrees,
                new ArrayInstance(symbols.map((sym, i) => 
                    html_id('a69549e92', [s((i)*360/symbols.length), s(sym)])
                )),
                digit_status,
                new ArrayInstance(digits.map(num => 
                    html_id('a3eec6129', [num])
                )),
                secret_container
            ]);
            function normalize_degrees(degrees) {
                // Normalize degrees from any number to an integer between [0, 360)
                return ((degrees % 360) + 360) % 360;
            }
            function degrees_to_symbol(degrees) {
                return symbols[Math.round(normalize_degrees(degrees) * symbols.length / 360) % symbols.length];
            }
                        
            // Behavior:
            let last_diff;

            // Attempt to enter the password
            passcode_enter:
            while (1) {
                for (const digit of digits) {
                    // For every difference from the scroll wheel or touches:
                    for await(const diff of scrollDiffs) {
                        degrees.value = normalize_degrees(degrees.value + diff);
                        digit.value = degrees_to_symbol(degrees.value);
                        if (digits.every((digit, i) => passcode[i] == digit.value)) {
                            // Check if the passcode is correct:
                            break passcode_enter;
                        } else if (last_diff === undefined) {
                            last_diff = diff;
                            continue;
                        } else if ((last_diff < 0 && diff > 0) || (last_diff > 0 && diff < 0)) {
                            // Check if we changed directions and should advance to the next digit
                            last_diff = diff;
                            break;
                        }
                    }
                }
                // If we used all the digits and got it wrong then change the digit container class:
                digit_status.value = "wrong";
                // Apply a penalty time:
                await delay(950);
                // Clear the digits:
                digits.forEach(digit => digit.value = "")
                // Clear the digits container class to nothing
                digit_status.value = "";
            }
            // Passcode is correct.  Change to confirmation class on the digit container:
            digit_status.value = "correct";
            // Display the secret message
            secret_container.value = secretMessage;
        })()]);
}