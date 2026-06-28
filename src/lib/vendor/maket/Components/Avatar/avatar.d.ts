import type { Snippet } from 'svelte';
import type { Sizes } from '../../types/index.js';
import type { Slot } from '../Slot/slot.js';
type LoadingState = 'waiting' | 'loading' | 'errored' | 'success';
export type AvatarProps<I> = {
    class?: string;
    size?: Sizes;
    user: {
        name: string;
        avatar?: string;
    } & I;
    delay?: number;
    loadingState?: LoadingState;
    imageClass?: string;
    initialsClass?: string;
    prefix?: Slot<{
        name: string;
        avatar?: string;
    }>;
    prefixClass?: string;
    suffix?: Slot<{
        name: string;
        avatar?: string;
    }>;
    suffixClass?: string;
};
export type AvatarGroupProps<I> = Omit<AvatarProps<I>, 'user'> & {
    max?: number;
    avatarClass?: string;
    avatar?: Snippet<[{
        user: I;
        index: number;
        avatarProps: Omit<AvatarProps<I>, 'user'>;
    }]>;
    remainingCount?: Snippet<[{
        users: I[];
        remaining: number;
    }]>;
    remainingCountClass?: string;
    users: Pick<AvatarProps<I>, 'user'>['user'][];
};
export type AvatarTheme = {
    base: string;
    image: string;
    prefix: string;
    suffix: string;
    initials: string;
    remainingCount: string;
    small: Omit<AvatarTheme, 'small' | 'large'>;
    large: Omit<AvatarTheme, 'small' | 'large'>;
};
export type AvatarGroupTheme = {
    base: string;
    'remaining-count': string;
    avatar: AvatarTheme;
    small: Omit<AvatarGroupTheme, 'small' | 'large'>;
    large: Omit<AvatarGroupTheme, 'small' | 'large'>;
};
export declare const avatar: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export declare const avatarGroup: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
export {};
