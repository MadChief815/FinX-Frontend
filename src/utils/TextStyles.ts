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
    size32Bold: createTextStyle(32, 'bold', 1.25),
    size28Bold: createTextStyle(28, 'bold', 1.3),

    size24Bold: createTextStyle(24, 'bold', 1.3),
    size24SemiBold: createTextStyle(24, 'semiBold', 1.3),

    size20Bold: createTextStyle(20, 'bold'),
    size20SemiBold: createTextStyle(20, 'semiBold'),

    size18SemiBold: createTextStyle(18, 'semiBold'),
    size18Medium: createTextStyle(18, 'medium'),

    size16Bold: createTextStyle(16, 'bold'),
    size16SemiBold: createTextStyle(16, 'semiBold'),
    size16Medium: createTextStyle(16, 'medium'),
    size16Regular: createTextStyle(16, 'regular', 1.5),

    size14SemiBold: createTextStyle(14, 'semiBold'),
    size14Medium: createTextStyle(14, 'medium'),
    size14Regular: createTextStyle(14, 'regular', 1.5),

    size12SemiBold: createTextStyle(12, 'semiBold'),
    size12Medium: createTextStyle(12, 'medium'),
    size12Regular: createTextStyle(12, 'regular', 1.5),
} as const;

// Combine any base style with any color
export const withColor = (style: TextStyle, color: ColorValue): TextStyle => ({
    ...style,
    color,
});

// Semantic aliases: use these for consistency across screens
export const TextPresets = {
    heading: withColor(TextStyles.size24Bold, Colors.neutral[100]),
    title: withColor(TextStyles.size18SemiBold, Colors.neutral[90]),
    body: withColor(TextStyles.size16Regular, Colors.neutral[80]),
    bodyMedium: withColor(TextStyles.size16Medium, Colors.neutral[80]),
    caption: withColor(TextStyles.size12Regular, Colors.neutral[60]),
    label: withColor(TextStyles.size14Medium, Colors.neutral[70]),
    button: withColor(TextStyles.size16SemiBold, Colors.neutral[10]),
    link: withColor(TextStyles.size14SemiBold, Colors.brand.orchid),
    error: withColor(TextStyles.size12Regular, Colors.status.error),
} as const;