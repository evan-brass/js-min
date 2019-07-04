export default function* range(start, end, step = 1) {
    for (let i = start; (step > 0) ? i < end : i > end; i += step) {
        yield i;
    }
}