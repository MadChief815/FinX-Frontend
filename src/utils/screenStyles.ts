import { StyleSheet } from "react-native";

// Components
import { Colors } from "./Colors";
import { s } from "./Responsive";

export const screenStyles = 
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: Colors.neutral[10],
            paddingHorizontal: s(20)
        }
    });