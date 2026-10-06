import { TextStyle } from 'react-native';
import { Colors } from './Colors';
import { Fonts } from './Typography';
import { ms } from './Responsive';

type FontWeightKey = keyof typeof Fonts;
type ColorValue = string;

const createTextStyle = (
    fontSize: number,
    weight: FontWeightKey,
    lineHeightRatio: number = 1.4,
): TextStyle => {
    const scaledSize = ms(fontSize);

    return {
        fontFamily: Fonts[weight],
        fontSize: scaledSize,
        lineHeight: Math.round(scaledSize * lineHeightRatio),
    };
};

// Base styles: named by size + weight (color is applied separately)
export const TextStyles = {

    Bold32: createTextStyle(32, 'bold', 1.25),
    
    Bold28: createTextStyle(28, 'bold', 1.3),

    Bold24: createTextStyle(24, 'bold', 1.3),
    SemiBold24: createTextStyle(24, 'semiBold', 1.3),

    Bold20: createTextStyle(20, 'bold'),
    SemiBold20: createTextStyle(20, 'semiBold'),

    SemiBold18: createTextStyle(18, 'semiBold'),
    Medium18: createTextStyle(18, 'medium'),

    Bold16: createTextStyle(16, 'bold'),
    SemiBold16: createTextStyle(16, 'semiBold'),
    Medium16: createTextStyle(16, 'medium'),
    Regular16: createTextStyle(16, 'regular', 1.5),

    SemiBold14: createTextStyle(14, 'semiBold'),
    Medium14: createTextStyle(14, 'medium'),
    Regular14: createTextStyle(14, 'regular', 1.5),

    SemiBold12: createTextStyle(12, 'semiBold'),
    Medium12: createTextStyle(12, 'medium'),
    Regular12: createTextStyle(12, 'regular', 1.5),
} as const;

// Combine any base style with any color
export const withColor = (
    style: TextStyle,
    color: ColorValue
): TextStyle => ({
    ...style,
    color,
});

// Semantic aliases: use these for consistency across screens
export const TextPresets = {
    heading: withColor(TextStyles.SemiBold18, Colors.neutral[100]),
    title: withColor(TextStyles.SemiBold18, Colors.neutral[90]),
    body: withColor(TextStyles.Regular16, Colors.neutral[80]),
    bodyMedium: withColor(TextStyles.Medium16, Colors.neutral[80]),
    caption: withColor(TextStyles.Regular12, Colors.neutral[60]),
    label: withColor(TextStyles.Medium14, Colors.neutral[70]),
    button: withColor(TextStyles.SemiBold16, Colors.neutral[10]),
    link: withColor(TextStyles.SemiBold14, Colors.brand.orchid),
    error: withColor(TextStyles.Regular12, Colors.status.error),
} as const;