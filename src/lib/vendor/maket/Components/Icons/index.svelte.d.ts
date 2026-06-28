declare module 'maket/icons/index.svelte' {
		import type { SVGAttributes } from 'svelte/elements';
type IconProps = {
    size: number;
    mirrored?: boolean;
    color?: string;
} & SVGAttributes<SVGSVGElement>;
export const icon: (...paths: string[]) => import("svelte").Snippet<[] | [IconProps]>;
export {};

	}