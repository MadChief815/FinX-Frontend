import React, { memo, useCallback, useRef, useState } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Components
import Header from '../../components/Header';
import { Colors } from '../../utils/Colors';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { getApiErrorMessage } from '../../utils/apiError';
import type { AuthStackParamList } from '../../navigation/types';
import { login as loginUser } from '../../api/adapters/auth.adapter';
import { useAuthStore } from '../../store/authStore';

// Icons
import { Ionicons } from '@expo/vector-icons';
import Facebook_Icon from '../../assets/AuthScreens/Facebook.svg';
import Google_Icon from '../../assets/AuthScreens/Google.svg';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

/* Static helpers (created once, not on every render) */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validatePassword = (value: string): string => {
  if (!value) return 'Enter your password.';
  if (value.length < 8) return 'Password must be at least 8 characters long.';
  return '';
};

const showUnavailableMessage = (feature: string): void => {
  showErrorToast(`${feature} is not available yet. Please try again later.`);
};

/* Memoized pieces */

type EmailFieldProps = {
  value: string;
  error: string;
  onChangeText: (value: string) => void;
  onSubmitEditing: () => void;
};

const EmailField = memo(function EmailField({
  value,
  error,
  onChangeText,
  onSubmitEditing,
}: EmailFieldProps) {
  return (
    <>
      <Text style={styles.label}>Email or Username</Text>
      <TextInput
        accessibilityLabel="Email Address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        blurOnSubmit={false}
        keyboardType="email-address"
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder="Enter your email or username"
        placeholderTextColor={Colors.neutral[60]}
        returnKeyType="next"
        style={error ? styles.inputWithError : styles.input}
        textContentType="emailAddress"
        value={value}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </>
  );
});

type PasswordFieldProps = {
  value: string;
  error: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggleVisible: () => void;
  onSubmitEditing: () => void;
  inputRef: React.RefObject<TextInput | null>;
};

const PasswordField = memo(function PasswordField({
  value,
  error,
  visible,
  onChangeText,
  onToggleVisible,
  onSubmitEditing,
  inputRef,
}: PasswordFieldProps) {
  return (
    <View style={styles.passwordField}>
      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="current-password"
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder="Enter your password"
          placeholderTextColor={Colors.neutral[60]}
          returnKeyType="done"
          secureTextEntry={!visible}
          style={error ? styles.passwordInputWithError : styles.passwordInput}
          textContentType="password"
          value={value}
        />
        <TouchableOpacity
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onToggleVisible}
          style={styles.passwordToggle}
        >
          <Ionicons
            name={visible ? 'eye-off' : 'eye'}
            size={ms(20)}
            color={Colors.neutral[100]}
          />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
});

const SocialSignIn = memo(function SocialSignIn() {
  const onGoogle = useCallback(() => showUnavailableMessage('Google sign-in'), []);
  const onFacebook = useCallback(() => showUnavailableMessage('Facebook sign-in'), []);

  return (
    <View style={styles.socialContainer}>
      <View style={styles.socialTitleRow}>
        <View style={styles.socialDivider} />
        <Text style={styles.socialTitle}>Or sign in with</Text>
        <View style={styles.socialDivider} />
      </View>
      <View style={styles.socialButtons}>
        <TouchableOpacity
          accessibilityLabel="Sign in with Google"
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onGoogle}
          style={styles.socialButton}
        >
          <Google_Icon width={ms(24)} height={ms(24)} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Sign in with Facebook"
          accessibilityRole="button"
          activeOpacity={0.7}
          onPress={onFacebook}
          style={styles.socialButton}
        >
          <Facebook_Icon width={ms(24)} height={ms(24)} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const SignUpPrompt = memo(function SignUpPrompt({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.signUpContainer}>
      <Text style={styles.signUpPrompt}>Don&apos;t have an account? </Text>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.7} onPress={onPress}>
        <Text style={styles.signUpAction}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
});

const SignInButton = memo(function SignInButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={loading}
      onPress={onPress}
      style={styles.signInButton}
    >
      {loading ? (
        <ActivityIndicator color={Colors.neutral[10]} />
      ) : (
        <Text style={styles.signInButtonText}>Sign In</Text>
      )}
    </TouchableOpacity>
  );
});

/*  Screen  */

export default function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<LoginNavigationProp>();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setEmail('');
      setPassword('');
      setEmailError('');
      setPasswordError('');
      setPasswordVisible(false);
    }, []),
  );

  // Setting an error to '' when it is already '' bails out, so no extra re-render.
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setEmailError('');
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setPasswordError('');
  }, []);

  const toggleVisible = useCallback(() => setPasswordVisible((v) => !v), []);
  const focusPassword = useCallback(() => passwordRef.current?.focus(), []);
  const goToRegister = useCallback(() => navigation.navigate('Register'), [navigation]);
  const onForgotPassword = useCallback(() => showUnavailableMessage('Password recovery'), []);

  const handleSignIn = useCallback(async (): Promise<void> => {
    const identifier = email.trim();
    const nextEmailError = !identifier
      ? 'Enter your email address or username.'
      : identifier.includes('@') && !EMAIL_REGEX.test(identifier)
        ? 'Enter a valid email address.'
        : '';
    const nextPasswordError = validatePassword(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      const session = await loginUser({ identifier, password });
      await useAuthStore.getState().login(session.accessToken, session.refreshToken);
      showSuccessToast('You are now signed in.');
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'Unable to sign in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password]);

  const onSubmit = useCallback(() => void handleSignIn(), [handleSignIn]);

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
          <Header title="Sign In" back={false} />

          <View style={screenStyles.container}>
            {/* Welcome */}
            <View style={styles.welcome}>
              <Text style={styles.title}>Hi, Welcome back!</Text>
              <Text style={styles.description}>
                Please enter your details to sign in and access your account.
              </Text>
            </View>

            {/* Form */}
            <EmailField
              value={email}
              error={emailError}
              onChangeText={handleEmailChange}
              onSubmitEditing={focusPassword}
            />
            <PasswordField
              inputRef={passwordRef}
              value={password}
              error={passwordError}
              visible={passwordVisible}
              onChangeText={handlePasswordChange}
              onToggleVisible={toggleVisible}
              onSubmitEditing={onSubmit}
            />

            {/* Actions */}
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={onForgotPassword}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <SignInButton loading={isSubmitting} onPress={onSubmit} />
            <SignUpPrompt onPress={goToRegister} />

            {/* Social Sign In */}
            <SocialSignIn />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/*  Styles  */

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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: vs(16),
    marginBottom: vs(32),
  },
  forgotPasswordText: {
    ...TextStyles.Medium14,
    color: Colors.brand.plum,
  },
  signInButton: {
    width: '100%',
    height: vs(48),
    backgroundColor: Colors.brand.deepPlum,
    borderRadius: ms(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    ...TextStyles.Medium16,
    color: Colors.neutral[10],
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vs(24),
  },
  signUpPrompt: {
    ...TextStyles.Regular16,
    color: Colors.neutral[70],
  },
  signUpAction: {
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
});