import { type HeadingTheme, type TextTheme } from '../Components/Typography/typography.js';
import { type SeparatorTheme } from '../Components/Separator/separator.js';
import { type CardTheme } from '../Components/Card/card.js';
import { type HoverCardTheme } from '../Components/HoverCard/hoverCard.js';
import { type ButtonTheme } from '../Components/Button/button.js';
import { type SliderTheme } from '../Components/Form/slider.js';
import type { PartialDeep } from 'type-fest';
import { type ToastTheme } from '../Components/Toast/toast.js';
import { type BreadcrumbsTheme } from '../Components/Breadcrumbs/breadcrumbs.js';
import { type CodeTheme } from '../Components/Code/code.js';
import { type ChipTheme } from '../Components/Chip/chip.js';
import { type CalloutTheme } from '../Components/Callout/callout.js';
import { type PinInputTheme } from '../Components/Form/pininput.js';
import { type BlockquoteTheme } from '../Components/Blockquote/blockquote.js';
import { type ThumbTheme } from '../Components/Thumb/thumb.js';
import { type AvatarGroupTheme, type AvatarTheme } from '../Components/Avatar/avatar.js';
import { type MarqueeTheme } from '../Components/Marquee/marquee.js';
import { type TabsTheme } from '../Components/Tabs/tabs.js';
import { type NetworkIndicatorTheme } from '../Components/NetworkIndicator/networkIndicator.js';
import { type KBDTheme } from '../Components/Kbd/kbd.js';
import { type SlideShowTheme } from '../Components/SlideShow/slideShow.js';
import { type AccordionTheme, type AccordionGroupTheme } from '../Components/Accordion/accordion.js';
import { type MenuTheme } from '../Components/Menus/menus.js';
import { type FormTheme, type FormFieldTheme } from '../Components/Form/form.js';
import { type TextInputTheme } from '../Components/Form/TextInput/textInput.js';
import { type ToggleGroupTheme, type ToggleButtonTheme } from '../Components/Toggle/toggle.js';
import { type BadgeTheme } from '../Components/Badge/badge.js';
import { type DialogTheme } from '../Components/Dialog/dialog.types.js';
import { type MeterTheme } from '../Components/Meter/meter.js';
import { type CalendarTheme } from '../Components/Form/Calendar/calendarInput.js';
import { type SplitLayoutTheme } from '../Components/SplitLayout/splitLayout.js';
import { type FileInputTheme } from '../Components/Form/File/fileInput.js';
import { type RadiosInputTheme } from '../Components/Form/RadiosInput/radiosInput.js';
import { type CheckBoxesInputTheme } from '../Components/Form/CheckBoxesInput/checkBoxesInput.js';
export declare const components: {
    readonly slider: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly separator: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly heading: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly text: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly button: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly toast: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly card: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly thumb: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly hoverCard: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly breadcrumbs: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly chip: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly code: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly callout: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly blockquote: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly pininput: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly avatar: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly avatarGroup: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly marquee: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly tabs: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly networkIndicator: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly kbd: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly slideShow: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly menu: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly accordion: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly accordionGroup: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly form: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly field: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly textInput: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly toggleButton: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly toggleGroup: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly dialog: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly meter: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly calendar: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly badge: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly splitLayout: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly fileInput: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly radiosInput: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
    readonly checkBoxesInput: (base?: object, target?: object) => {
        [x: string]: {};
    } & Record<string, Record<string, string>>;
};
export type Components = typeof components;
export type ComponentsSystem = PartialDeep<{
    card: CardTheme;
    hoverCard: HoverCardTheme;
    accordion: AccordionTheme;
    accordionGroup: AccordionGroupTheme;
    slider: SliderTheme;
    separator: SeparatorTheme;
    heading: HeadingTheme;
    text: TextTheme;
    button: ButtonTheme;
    toast: ToastTheme;
    breadcrumbs: BreadcrumbsTheme;
    code: CodeTheme;
    chip: ChipTheme;
    callout: CalloutTheme;
    pininput: PinInputTheme;
    blockquote: BlockquoteTheme;
    thumb: ThumbTheme;
    avatar: AvatarTheme;
    avatarGroup: AvatarGroupTheme;
    marquee: MarqueeTheme;
    tabs: TabsTheme;
    networkIndicator: NetworkIndicatorTheme;
    kbd: KBDTheme;
    slideShow: SlideShowTheme;
    menu: MenuTheme;
    form: FormTheme;
    field: FormFieldTheme;
    textInput: TextInputTheme;
    toggleButton: ToggleButtonTheme;
    toggleGroup: ToggleGroupTheme;
    badge: BadgeTheme;
    dialog: DialogTheme;
    meter: MeterTheme;
    calendar: CalendarTheme;
    splitLayout: SplitLayoutTheme;
    fileInput: FileInputTheme;
    radiosInput: RadiosInputTheme;
    checkBoxesInput: CheckBoxesInputTheme;
}>;
