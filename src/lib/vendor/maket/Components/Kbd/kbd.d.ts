import type { Colors, Sizes } from '../../types/index.js';
import type { Slot } from '../Slot/slot.js';
export type KBDKey = 'command' | 'shift' | 'ctrl' | 'option' | 'enter' | 'delete' | 'escape' | 'tab' | 'capslock' | 'up' | 'right' | 'down' | 'left' | 'pageup' | 'pagedown' | 'home' | 'end' | 'help' | 'space';
export declare const getKBDKey: (key: KBDProps["keys"][number]) => (string & {}) | "⌘" | "⇧" | "⌃" | "⌥" | "↵" | "⌫" | "⎋" | "⇥" | "⇪" | "↑" | "→" | "↓" | "←" | "⇞" | "⇟" | "↖" | "↘" | "?" | "␣";
export declare const getKBDKeyLabel: (key: KBDProps["keys"][number]) => (string & {}) | "Tab" | "Left" | "Right" | "Escape" | "Command" | "Shift" | "Control" | "Option" | "Enter" | "Delete" | "Caps Lock" | "Up" | "Down" | "Page Up" | "Page Down" | "Home" | "End" | "Help" | "Space";
export type KBDProps = {
    keys: (KBDKey | (string & {}))[];
    class?: string;
    suffix?: Slot;
    prefix?: Slot;
    variant?: 'solid' | 'outline' | 'ghost' | 'soft';
    size?: Sizes;
    color?: Colors;
    swapCtrlForCommandOnMac?: boolean;
    swapCommandForCtrlOnWindows?: boolean;
};
export type KBDTheme = {
    base: string;
    keys: string;
    solid: string;
    outline: string;
    ghost: string;
    normal: string;
    large: string;
    small: string;
    soft: string;
};
export declare const kbd: (base?: object, target?: object) => {
    [x: string]: {};
} & Record<string, Record<string, string>>;
