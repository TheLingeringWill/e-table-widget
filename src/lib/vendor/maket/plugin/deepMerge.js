export const deepMerge = (a, b) => {
    a = structuredClone(a || {});
    b = structuredClone(b || {});
    for (const key in b) {
        if (b[key] !== undefined && typeof b[key] === 'object') {
            a = Object.assign({}, a, {
                [key]: deepMerge(a[key] || {}, b[key] || {})
            });
        }
        else {
            a = Object.assign({}, a, { [key]: b[key] });
        }
    }
    return a;
};
