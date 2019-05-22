import range from './range.mjs';

export default function ObservableArray() {
    let removed = new Map();
    let added = new Map();
    let moved = new Map();

    const wait = {
        callbacks: [],
        then(callback) {
            callbacks.push(callback);
        },
        resolve(val) {
            for (let func = this.callbacks.pop(); func; func = this.callbacks.pop()) {
                func(val);
            }
        }
    }

    const proxy = new Proxy([], {
        set(target, key, newValue) {
            // There has got to be a better way of keeping track of this... As much as I hate diffing, it might be more efficient in some circumstances.  Really, diffing is only useful when you're doing lot's of changes that can overlap.  I learned however, that chrome sorts the array and then performs all of the sets and it even sets values that haven't changed so there's some overlap.
            // TODO: Make data driven decisions about this whole array thing.
            if (Number.parseInt(key) !== NaN && key >= 0) { // Only handle setting on indices
                const curValue = target[key];
    
                if (curValue !== newValue) {
                    // Previous Value
                    if (curValue !== undefined) { // TODO: take into account length
                        if (added.has(curValue)) {
                            // Added and then removed: nothing
                            added.delete(curValue);
                            const newKey = added.get(curValue);
                            moved.set(curValue, {from: key, to: newKey});
                            added.delete(curValue);
                        } else if (moved.has(curValue)) {
                            // Moved and then removed: removed
                            removed.set(curValue, moved.get(curValue).from);
                            moved.delete(curValue);
                        } else {
                            // Just removed: removed
                            removed.set(curValue, key);
                        }
                    }
                    // New Value
                    if (removed.has(newValue)) {
                        // Removed and then added: moved
                        const oldkey = removed.get(newValue);
                        moved.set(newValue, {from: oldkey, to: key});
                        removed.delete(newValue);
                    } else if (moved.has(newValue)) {
                        // Moved and then moved: moved
                        moved.get(newValue).to = key;
                    } else {
                        // Just added: added
                        added.set(newValue, key);
                    }
                }

                wait.resolve();
            } else if (key == 'length') {
                for (const i of range(newValue, target.length)) {
                    removed.set(target[i], i);
                    target[i] = undefined;
                }
            }
            
            target[key] = newValue;
            console.log('Setting: ', key, 'to:', newValue);
            return true;
        }
    });

    return {wait, changes: {removed, added, moved}, proxy};
}