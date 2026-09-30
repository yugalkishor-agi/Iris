import { TextLayer, TextAlignMode, TextBackgroundOption } from "./types";
import { COLORS } from "./constants";

export const getVariantContainerStyle = (layer?: TextLayer) => ({});
export const getVariantTextStyle = (layer?: TextLayer) => ({});
export const getTextShadowStyle = (layer?: TextLayer) => ({});
export const getContrastText = (c: string) => '#000000';
export const round2 = (val: number) => Math.round(val * 100) / 100;
export const cycleAlign = (a: TextAlignMode): TextAlignMode => a === 'left' ? 'center' : (a === 'center' ? 'right' : 'left');
export const normalizeComposerTextColor = (c: string, background?: TextBackgroundOption) => c;
export const composerToolIconColor = (active: boolean) => (active ? '#08111F' : 'rgba(255,255,255,0.9)');
