import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

// Icons
import { Ionicons } from '@expo/vector-icons';

// Components
import { ms, s, vs } from '../utils/Responsive';
import { TextPresets } from '../utils/TextStyles';
import { Colors } from '../utils/Colors';

interface HeaderProps {
  title: string;
  titleColor?: string;
  onBackPress?: () => void;
  back: boolean;
}

export default function Header({
  title,
  titleColor,
  onBackPress,
  back,
}: HeaderProps) {
  return (
    <View style={styles.container}>

      {/* Back Button */}
      {back === true && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
          activeOpacity={0.5}
        >
          <Ionicons
            name="chevron-back"
            size={ms(24)}
            color={Colors.neutral[100]}
          />
        </TouchableOpacity>
      )}

      {/* Header Title */}
      <Text
        style={[
          TextPresets.heading,
          titleColor !== undefined && { color: titleColor },
        ]}
      >
        {title}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: vs(64),
    // width: width,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',

    // Bottom border only
    borderBottomWidth: 1,
    borderBottomColor: '#E3E9ED',
  },

  backButton: {
    position: 'absolute',
    left: s(4),
    width: ms(44),
    height: ms(44),
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: '#E3E9ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
});