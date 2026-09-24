import { View, StyleSheet, Text } from 'react-native';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
});