import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const GRADIENT_COLORS = ['#57435C', '#130C2A'] as const;

export default function SplashScreen(): React.JSX.Element {
	return (
		<LinearGradient
			colors={GRADIENT_COLORS}
			start={{ x: 0.5, y: 0 }}
			end={{ x: 0.5, y: 1 }}
			style={styles.container}
		>
			<StatusBar style="light" />
			<Image
				accessibilityLabel="FinX"
				resizeMode="contain"
				source={require('../../assets/SplashScreen/splash-logo.png')}
				style={styles.logo}
			/>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
	},
	logo: {
		height: 190,
		width: 190,
	},
});