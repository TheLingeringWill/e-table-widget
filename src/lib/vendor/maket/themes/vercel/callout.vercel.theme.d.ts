import type { Utils } from '../../../plugin/utilities';
export declare const vercel_callout: ({ theme, fontSize, upperFirst }: Utils) => {
    '.ui-callout': {
        display: string;
        alignItems: string;
        gap: any;
        borderRadius: any;
        padding: string;
        maxWidth: string;
        containerType: string;
        flexWrap: string;
        '&[data-size="large"]': {
            padding: string;
            '.ui-callout-title': any;
            '.ui-callout-description': any;
            '.ui-callout-icon': {
                width: string;
                height: string;
            };
        };
        '&[data-size="small"]': {
            padding: string;
            '.ui-callout-title': any;
            '.ui-callout-description': any;
            '.ui-callout-icon': {
                width: string;
                height: string;
            };
        };
    };
    '.ui-callout-content': {
        flex: string;
        display: string;
        gap: any;
    };
    '.ui-callout-actions': {
        width: string;
        display: string;
        gap: any;
        flexWrap: string;
    };
};
