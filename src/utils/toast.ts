import Toast from 'react-native-toast-message';

export const showErrorToast = (message: string, title: string = 'Error'): void => {
    Toast.show({
        type: 'error',
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: 4000,
    });
};

// For later use (not used for font loading)
export const showSuccessToast = (message: string, title: string = 'Success'): void => {
    Toast.show({
        type: 'success',
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: 3000,
    });
};