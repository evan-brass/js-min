import range from './range.mjs';

export default class ObservableArray {
    constructor(initial = []) {
        this.removed = new Map();
        this.added = new Map();
        this.moved = new Map();

        this.callback = () => {}; // Default callback
    
        this.proxy = new Proxy(initial, {
            get: (target, key) => {
                // console.log(key);
                if ((Number.parseInt(key) !== NaN && key >= 0) || key == "length") {
                    return target[key];
                } else {
                    return Array.prototype[key].bind(this.proxy);
                }
            },
            set: (target, key, newValue) => {
                // There has got to be a better way of keeping track of this... As much as I hate diffing, it might be more efficient in some circumstances.  Really, diffing is only useful when you're doing lot's of changes that can overlap.  I learned however, that chrome sorts the array and then performs all of the sets and it even sets values that haven't changed so there's some overlap.
                // TODO: Make data driven decisions about this whole array thing.
                if (Number.parseInt(key) !== NaN && key >= 0) { // Only handle setting on indices
                    const curValue = target[key];
        
                    if (curValue !== newValue) {
                        // Previous Value
                        if (curValue !== undefined) { // TODO: take into account length
                            if (this.added.has(curValue)) {
                                // Added and then removed: nothing
                                this.added.delete(curValue);
                                const newKey = this.added.get(curValue);
                                this.moved.set(curValue, {from: key, to: newKey});
                                this.added.delete(curValue);
                            } else if (this.moved.has(curValue)) {
                                // Moved and then removed: removed
                                this.removed.set(curValue, this.moved.get(curValue).from);
                                this.moved.delete(curValue);
                            } else {
                                // Just removed: removed
                                this.removed.set(curValue, key);
                            }
                        }
                        // New Value
                        if (this.removed.has(newValue)) {
                            // Removed and then added: moved
                            const oldkey = this.removed.get(newValue);
                            this.moved.set(newValue, {from: oldkey, to: key});
                            this.removed.delete(newValue);
                        } else if (this.moved.has(newValue)) {
                            // Moved and then moved: moved
                            // TODO: Catch the case of it being moved back to it's original spot
                            this.moved.get(newValue).to = key;
                        } else {
                            // Just added: added
                            this.added.set(newValue, key);
                        }
                    }
                } else if (key == 'length') {
                    for (const i of range(newValue, target.length)) {
                        this.removed.set(target[i], i);
                        target[i] = undefined;
                    }
                }
                
                target[key] = newValue;
                this.callback(this);
                //console.log('Setting: ', key, 'to:', newValue);
                return true;
            }
        });
    }
}