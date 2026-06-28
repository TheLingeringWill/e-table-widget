type Func = (...args: any[]) => void;
type Execute = (Func | [Func, Record<string, string | number>])[];
type $$ComponentProps = {
    execute?: Execute;
    stylize?: string[];
};
declare const BeforeHydratation: import("svelte").Component<$$ComponentProps, {}, "">;
type BeforeHydratation = ReturnType<typeof BeforeHydratation>;
export default BeforeHydratation;
