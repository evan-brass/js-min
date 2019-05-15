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

    function* range(start, end, step = 1) {
        for (let i = start; i < end; i += step) {
            yield i;
        }
    }

    const proxy = new Proxy([], {
        set(target, key, newValue) {
            if (Number.parseInt(key) !== NaN && key >= 0) { // Only handle setting on indices
                const curValue = target[key];
    
                if (curValue !== undefined) { // TODO: take into account length
                    removed.set(curValue, key); // Remove the previous value;
                }
                if (removed.has(newValue)) {
                    const oldkey = removed.get(newValue);
                    moved.set(newValue, {from: oldkey, to: key});
                    removed.delete(newValue);
                } else {
                    added.set(newValue, key);
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