import type { Colors } from '../types/index.js';
export declare class MeshGenerator {
    length: number;
    hash: number;
    baseHash: number;
    baseColor: string;
    mode?: 'dark' | 'light' | 'normal';
    colors: Colors;
    constructor(opts: {
        colors: Colors;
        hash?: number;
        length?: number;
    });
    getHashPercent(value: number, hash: number, length: number): number;
    hexToHSL(hex: string): number;
    genColors(initialHue: number): string[];
    genGrad(colors: string[]): string[];
    modifyColor: (color: string) => string;
    generateMeshGradient(): Record<string, string>;
    generateTailwindGradients: () => {};
}
