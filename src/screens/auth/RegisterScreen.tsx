import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Components
import Header from '../../components/Header';
import Facebook_Icon from '../../assets/AuthScreens/Facebook.svg';
import Google_Icon from '../../assets/AuthScreens/Google.svg';
import type { AuthStackParamList } from '../../navigation/types';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast } from '../../utils/toast';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_NAME_REGEX = /^[A-Za-z0-9]+$/;

const showUnavailableMessage = (feature: string): void => {
  showErrorToast(`${feature} is not available yet. Please try again later.`);
};

export default function RegisterScreen(): React.JSX.Element {
  const navigation = useNavigation<RegisterNavigationProp>();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setUserName('');
      setEmail('');
      setPassword('');
      setUserNameError('');
      setEmailError('');
      setPasswordError('');
      setPasswordVisible(false);
    }, []),
  );

  const handleSignUp = async (): Promise<void> => {
    const nextUserNameError = !userName
      ? 'Enter your username.'
      : userName.length < 6 || userName.length > 24
        ? 'Username must be between 6 and 24 characters.'
        : !USER_NAME_REGEX.test(userName)
          ? 'Username can only contain letters and numbers, with no spaces or symbols.'
          : '';
    const normalizedEmail = email.trim();
    const nextEmailError = !normalizedEmail
      ? 'Enter your email address.'
      : !EMAIL_REGEX.test(normalizedEmail)
        ? 'Enter a valid email address.'
        : '';
    const nextPasswordError = !password
      ? 'Enter your password.'
      : password.length < 8
        ? 'Password must be at least 8 characters long.'
        : '';

    setUserNameError(nextUserNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextUserNameError || nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      showErrorToast('Sign-up is not available yet. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[screenStyles.container, styles.screenContainer]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Header title="Sign Up" back onBackPress={() => navigation.goBack()} />

          <View style={screenStyles.container}>
            {/* Welcome */}
            <View style={styles.welcome}>
              <Text style={styles.title}>Create an account</Text>
              <Text style={styles.description}>
                Enter your details to create your account.
              </Text>
            </View>

            {/* Form */}
            <Text style={styles.label}>User Name</Text>
            <TextInput
              accessibilityLabel="User Name"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              onChangeText={(value) => {
                setUserName(value);
                setUserNameError('');
              }}
              onSubmitEditing={() => emailRef.current?.focus()}
              placeholder="Enter a username"
              placeholderTextColor={Colors.neutral[60]}
              returnKeyType="next"
              style={userNameError ? styles.inputWithError : styles.input}
              value={userName}
            />
            {userNameError ? <Text style={styles.fieldError}>{userNameError}</Text> : null}

            <View style={styles.passwordField}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                ref={emailRef}
                accessibilityLabel="Email Address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                blurOnSubmit={false}
                keyboardType="email-address"
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError('');
                }}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="Enter a email"
                placeholderTextColor={Colors.neutral[60]}
                returnKeyType="next"
                style={emailError ? styles.inputWithError : styles.input}
                textContentType="emailAddress"
                value={email}
              />
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>

            <View style={styles.passwordField}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  ref={passwordRef}
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  onChangeText={(value) => {
                    setPassword(value);
                    setPasswordError('');
                  }}
                  onSubmitEditing={() => void handleSignUp()}
                  placeholder="Enter a password"
                  placeholderTextColor={Colors.neutral[60]}
                  returnKeyType="done"
                  secureTextEntry={!passwordVisible}
                  style={passwordError ? styles.passwordInputWithError : styles.passwordInput}
                  textContentType="newPassword"
                  value={password}
                />
                <TouchableOpacity
                  accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={ms(20)}
                    color={Colors.neutral[100]}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </View>

            {/* Actions */}
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.8}
              disabled={isSubmitting}
              onPress={() => void handleSignUp()}
              style={styles.actionButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.neutral[10]} />
              ) : (
                <Text style={styles.actionButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.accountPrompt}>
              <Text style={styles.accountPromptText}>Already have an account? </Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.accountPromptAction}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Social Sign Up */}
            <View style={styles.socialContainer}>
              <View style={styles.socialTitleRow}>
                <View style={styles.socialDivider} />
                <Text style={styles.socialTitle}>Or sign up with</Text>
                <View style={styles.socialDivider} />
              </View>
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  accessibilityLabel="Sign up with Google"
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={() => showUnavailableMessage('Google sign-up')}
                  style={styles.socialButton}
                >
                  <Google_Icon width={ms(24)} height={ms(24)} />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel="Sign up with Facebook"
                  accessibilityRole="button"
                  activeOpacity={0.7}
                  onPress={() => showUnavailableMessage('Facebook sign-up')}
                  style={styles.socialButton}
                >
                  <Facebook_Icon width={ms(24)} height={ms(24)} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By signing up you agree to our{' '}
              <Text style={styles.termsEmphasis}>Terms</Text>
              {' '}and{' '}
              <Text style={styles.termsEmphasis}>Conditions of Use</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseInput = {
  ...TextStyles.SemiBold12,
  color: Colors.neutral[70],
  height: vs(52),
  backgroundColor: Colors.neutral[10],
  borderWidth: 1,
  borderColor: Colors.neutral[30],
  borderRadius: ms(16),
  paddingHorizontal: s(16),
} as const;

const styles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: 0,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: vs(24),
  },
  welcome: {
    marginTop: vs(32),
    marginBottom: vs(36),
  },
  title: {
    ...TextStyles.SemiBold24,
    color: Colors.neutral[100],
    marginBottom: vs(8),
  },
  description: {
    ...TextStyles.Regular14,
    color: Colors.neutral[70],
  },
  label: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[100],
    marginBottom: vs(8),
  },
  input: baseInput,
  inputWithError: {
    ...baseInput,
    borderColor: Colors.status.error,
  },
  fieldError: {
    ...TextStyles.Regular12,
    color: Colors.status.error,
    marginTop: vs(4),
  },
  passwordField: {
    marginTop: vs(16),
  },
  passwordInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    ...baseInput,
    paddingRight: s(64),
  },
  passwordInputWithError: {
    ...baseInput,
    paddingRight: s(64),
    borderColor: Colors.status.error,
  },
  passwordToggle: {
    position: 'absolute',
    right: s(4),
    width: s(44),
    height: vs(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    height: vs(48),
    marginTop: vs(32),
    backgroundColor: Colors.brand.deepPlum,
    borderRadius: ms(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    ...TextStyles.Medium16,
    color: Colors.neutral[10],
  },
  accountPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(24),
  },
  accountPromptText: {
    ...TextStyles.Regular16,
    color: Colors.neutral[70],
  },
  accountPromptAction: {
    ...TextStyles.Medium16,
    color: Colors.brand.deepPlum,
  },
  socialContainer: {
    alignItems: 'center',
    marginTop: vs(16),
  },
  socialTitle: {
    ...TextStyles.Medium14,
    color: Colors.neutral[60],
    marginHorizontal: s(12),
  },
  socialTitleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(24),
  },
  socialDivider: {
    width: s(62),
    height: vs(1),
    backgroundColor: Colors.neutral[30],
  },
  socialButtons: {
    flexDirection: 'row',
    gap: s(24),
  },
  socialButton: {
    width: s(48),
    height: vs(48),
    borderRadius: ms(24),
    backgroundColor: Colors.neutral[20],
    justifyContent: 'center',
    alignItems: 'center',
  },
  terms: {
    ...TextStyles.Medium14,
    color: Colors.neutral[70],
    textAlign: 'center',
    marginTop: vs(24),
  },
  termsEmphasis: {
    ...TextStyles.SemiBold14,
    color: Colors.neutral[100],
  },
});
