export const deepMerge = (a, b) => {
    a = a || {};
    b = b || {};
    for (const key in b) {
        if (b[key] !== undefined && typeof b[key] === 'object') {
            Object.assign(a, {
                [key]: deepMerge(a[key] || {}, b[key] || {})
            });
        }
        else {
            Object.assign(a, { [key]: b[key] });
        }
    }
    return a;
};
