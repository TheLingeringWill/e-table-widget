// https://github.com/AleksandrHovhannisyan/fluid-type-scale-calculator
const scales = {
    'Minor Second': 1.067,
    'Major Second': 1.125,
    'Minor Third': 1.2,
    'Major Third': 1.25,
    'Perfect Fourth': 1.32,
    'Augmented Fourth': 1.414,
    'Perfect Fifth': 1.5,
    'Golden Ratio': 1.618
};
export const getTypeScale = (state) => {
    const typeScaleSteps = {
        all: ['xs', 's', 'DEFAULT', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
        base: 'xs'
    };
    const shouldUseRems = state.shouldUseRems ?? true;
    /** Appends the correct unit to a unitless value. */
    const withUnit = (unitlessValue) => `${unitlessValue}${shouldUseRems ? 'rem' : 'px'}`;
    /** Rounds the given value to a fixed number of decimal places, according to the user's specified value. */
    const round = (val) => Number(val.toFixed(2));
    /** If we're using rems, converts the pixel arg to rems. Else, keeps it in pixels. */
    const convertToDesiredUnit = (px) => shouldUseRems ? px / (state.remValueInPx || 16) : px;
    // Get the index of the base modular step to compute exponents relative to the base index (up/down)
    const baseStepIndex = typeScaleSteps.all.indexOf(typeScaleSteps.base);
    // Reshape the data so we map each step name to a config describing its fluid font sizing values.
    // Do this on every render because it's essentially derived state; no need for a useEffect.
    // Note that some state variables are not necessary for this calculation, but it's simple enough that it's not expensive.
    const typeScale = typeScaleSteps.all.reduce((steps, step, i) => {
        const min = {
            fontSize: (state.min?.fontSize || 14) *
                Math.pow(scales[state.min?.ratio || 'Perfect Fourth'], i - baseStepIndex),
            breakpoint: state.min?.screenWidth
        };
        const max = {
            fontSize: (state.max?.fontSize || 16) *
                Math.pow(scales[state.max?.ratio || 'Perfect Fourth'], i - baseStepIndex),
            breakpoint: state.max?.screenWidth
        };
        const slope = (max.fontSize - min.fontSize) / ((max.breakpoint || 1024) - (min.breakpoint || 640));
        const slopeVw = `${round(slope * 100)}vw`;
        const intercept = min.fontSize - slope * (min.breakpoint || 640);
        const minV = withUnit(round(convertToDesiredUnit(min.fontSize)));
        const maxV = withUnit(round(convertToDesiredUnit(max.fontSize)));
        const preferred = `${slopeVw} + ${withUnit(round(convertToDesiredUnit(intercept)))}`;
        const value = `clamp(${minV}, ${preferred}, ${maxV})`;
        Object.assign(steps, {
            [step]: [value, `calc(${value} * 1.1)`]
        });
        return steps;
        // NOTE: Using a Map instead of an object to preserve key insertion order.
    }, {});
    return typeScale;
};
