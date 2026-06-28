export type TypeScale = Record<string, string>;
declare const scales: {
    readonly 'Minor Second': 1.067;
    readonly 'Major Second': 1.125;
    readonly 'Minor Third': 1.2;
    readonly 'Major Third': 1.25;
    readonly 'Perfect Fourth': 1.32;
    readonly 'Augmented Fourth': 1.414;
    readonly 'Perfect Fifth': 1.5;
    readonly 'Golden Ratio': 1.618;
};
type Scale = keyof typeof scales;
export type BreakpointConfig = {
    /** The font size (in pixels) at this breakpoint */
    fontSize?: number;
    /** The viewport width corresponding to this breakpoint. */
    screenWidth?: number;
    /** The modular type scale ratio to use at this breakpoint to scale the base font size up/down. */
    ratio?: Scale;
};
/** Given a form state representing user input for the various parameters, returns
 * the corresponding type scale mapping each step to its min/max/preferred font sizes.
 */
type TypeScaleParams = {
    /** The minimum (mobile) config, describing how the font size should behave when the viewport width is narrower than the desktop breakpoint. */
    min?: BreakpointConfig;
    /** The maximum (desktop) config, describing how the font size should behave when the viewport width is >= this breakpoint. */
    max?: BreakpointConfig;
    /** Whether to use rems for font sizing in the output. */
    shouldUseRems?: boolean;
    /** The pixel value of 1rem. */
    remValueInPx?: number;
};
export declare const getTypeScale: (state: TypeScaleParams) => TypeScale;
export {};
