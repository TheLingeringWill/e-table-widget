import { toHsla, lighten, darken } from 'color2k';
export class MeshGenerator {
    length = 10;
    hash;
    baseHash;
    baseColor;
    mode = 'normal';
    colors;
    constructor(opts) {
        this.colors = opts.colors;
        this.hash = opts.hash || 33;
        this.baseHash = this.hash;
        this.length = opts.length || this.length;
        this.baseColor = opts.colors.primary.DEFAULT;
    }
    getHashPercent(value, hash, length) {
        return Math.round(((hash / length) * (value * 100)) % 100);
    }
    hexToHSL(hex) {
        const h = toHsla(hex).split(',')[0].split('(')[1];
        return parseInt(h);
    }
    genColors(initialHue) {
        return Array.from({ length: this.length }, (_, i) => {
            if (i === 0) {
                const b_string = `hsla(${initialHue}, 100%, 74%, 1)`;
                return b_string;
            }
            if (i < this.length / 1.4) {
                const a_string = `hsla(${Math.abs(initialHue + 30 * (1 - 2 * (i % 2)) * (i > 2 ? i / 2 : i))}, 100%, ${64 - i * (1 - 2 * (i % 2)) * 1.75}%, 1)`;
                return a_string;
            }
            const c_string = `hsla(${Math.abs(initialHue - 150 * (1 - 2 * (i % 2)))}, 100%, ${66 - i * (1 - 2 * (i % 2)) * 1.25}%, 1)`;
            return c_string;
        });
    }
    genGrad(colors) {
        return Array.from({ length: this.length }, (_, i) => {
            return `radial-gradient(at ${this.getHashPercent(i, this.hash, this.length)}% ${this.getHashPercent(i * 10, this.hash, this.length)}%, ${colors[i]} -100%, transparent 55%)\n`;
        });
    }
    modifyColor = (color) => {
        switch (this.mode) {
            case 'dark':
                return darken(color, 0.3);
            case 'light':
                return lighten(color, 0.17);
            default:
                return color;
        }
    };
    generateMeshGradient() {
        const colors = this.genColors(this.hexToHSL(this.baseColor)).map(this.modifyColor);
        const proprieties = this.genGrad(colors);
        const [bgColor, bgImage] = [colors[0], proprieties.join(',')];
        return {
            'background-color': bgColor,
            'background-blend-mode': 'screen',
            'background-image': bgImage
        };
    }
    generateTailwindGradients = () => {
        const gradient_utility = {};
        const modes = ['light', 'dark', 'normal'];
        const colors = ['danger', 'success', 'warning', 'info', 'primary'];
        colors.forEach((color) => {
            modes.forEach((mode) => {
                this.mode = mode;
                this.baseColor = this.colors[color].DEFAULT;
                Array.from({ length: 5 }, (_, i) => {
                    this.hash = this.baseHash + i * 3;
                    const result = this.generateMeshGradient();
                    Object.assign(gradient_utility, {
                        [`.bg-grad-${color}${mode !== 'normal' ? `-${mode}-` : '-'}${i + 1}`]: result
                    });
                });
            });
        });
        return gradient_utility;
    };
}
