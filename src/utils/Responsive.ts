import { Dimensions, PixelRatio } from 'react-native';

// Match Figma frame
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Cap so tablets don't scale things up endlessly
const MAX_SCALE_WIDTH = 480;

const { width, height } = Dimensions.get('window');
const shortSide = Math.min(width, height);
const longSide = Math.max(width, height);

const round = (value: number): number => PixelRatio.roundToNearestPixel(value);

// Linear scale by width: use for horizontal spacing, widths, icon sizes
export const scale = (size: number): number =>
    round((Math.min(shortSide, MAX_SCALE_WIDTH) / BASE_WIDTH) * size);

// Linear scale by height: use for vertical spacing, fixed heights
export const verticalScale = (size: number): number =>
    round((longSide / BASE_HEIGHT) * size);

// Partial scale: use for font sizes, radii, anything that shouldn't grow too fast
export const moderateScale = (size: number, factor: number = 0.5): number =>
    round(size + (scale(size) - size) * factor);

// Short aliases
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;