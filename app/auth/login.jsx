import { useEffect, useMemo, useState } from 'react';
import { View, Text, Keyboard, KeyboardAvoidingView, Platform, TouchableOpacity, TouchableWithoutFeedback, Linking, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { useAppContext } from '@/context';
import { router, Link } from 'expo-router';
import { Home as LogoIcon } from '@/components/logo';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';
import { getAuthToken } from '@/utils/authTokenStorage';

const TERMS_ACCEPTED_KEY = 'terms_accepted_v1';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const { saveAuth } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TERMS_ACCEPTED_KEY)
      .then((value) => {
        if (value === '1') setTermsAccepted(true);
      })
      .catch(() => {});
  }, []);

  const toggleTermsAccepted = async () => {
    const next = !termsAccepted;
    setTermsAccepted(next);
    try {
      if (next) {
        await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, '1');
      } else {
        await AsyncStorage.removeItem(TERMS_ACCEPTED_KEY);
      }
    } catch {
      // Persist best-effort; checkbox state still gates login.
    }
  };

  const submit = async () => {
    if (!email || !password) return setError('Please enter your credentials');
    if (!termsAccepted) {
      return setError('Please agree to the Terms of Use and Privacy Policy');
    }
    setLoading(true);
    setError('');
    try {
      const response = await API.post('mobile/login', { email, password });

      if (response?.data) {
        let responseData = response.data;

        // Handle case where response.data is a string (contains HTML warnings + JSON)
        if (typeof responseData === 'string') {
          const jsonMatch = responseData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              responseData = JSON.parse(jsonMatch[0]);
            } catch {
              throw new Error('Invalid response format');
            }
          } else {
            throw new Error('No JSON found in response');
          }
        }

        if (!responseData.token || responseData.token === 'false' || responseData.token === false) {
          throw new Error('Invalid token received from server');
        }

        if (!responseData.user) {
          throw new Error('Missing user data');
        }

        await saveAuth(responseData.token, responseData.user);

        const savedToken = await getAuthToken();
        if (!savedToken || savedToken === 'false') {
          throw new Error('Failed to save authentication token');
        }

        // Redirect to loading page to verify token and register push notifications
        router.replace('/loading');
      } else {
        throw new Error('No data received');
      }
    } catch (e) {
      if (__DEV__) {
        console.error('[LOGIN] Login failed', e?.message || e);
      }
      setError(e?.response?.data?.message || e?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isDark = colorScheme === 'dark';
  const keyboardVerticalOffset = useMemo(() => (Platform.OS === 'ios' ? 0 : 24), []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}
      >
        <View className={`flex-1 px-6 ${isKeyboardVisible ? 'pt-10 pb-6' : 'pt-16 pb-12'}`}>
          {!isKeyboardVisible && (
            <View className="items-center mt-4">
              <LogoIcon color={isDark ? '#fff' : '#000'} width={80} height={80} />
              <Text className="text-2xl font-bold text-black dark:text-white mt-3">LIONSGEEK</Text>
            </View>
          )}

          <View className="flex-1 justify-center max-w-md w-full mx-auto">
            {!isKeyboardVisible && (
              <View className="items-center mb-8">
                <Text className="text-2xl font-semibold text-black dark:text-white">Welcome</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please enter your information</Text>
              </View>
            )}

            {!!error && (
              <Text className="text-red-500 mb-4 text-center text-sm font-medium">
                {error}
              </Text>
            )}

            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              placeholder="email@example.com"
              error={!!error}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={submit}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={isDark ? '#999' : '#666'}
                  />
                </TouchableOpacity>
              }
            />

            <Pressable
              onPress={toggleTermsAccepted}
              className="flex-row items-start gap-3 mt-1 mb-3"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              <View
                className={`w-5 h-5 mt-0.5 rounded border items-center justify-center ${
                  termsAccepted
                    ? 'bg-alpha border-alpha'
                    : 'border-gray-400 dark:border-gray-500 bg-transparent'
                }`}
              >
                {termsAccepted ? (
                  <Ionicons name="checkmark" size={14} color="#000" />
                ) : null}
              </View>
              <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-5">
                I agree to the{' '}
                <Text
                  className="text-alpha font-semibold"
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    router.push('/legal/terms');
                  }}
                >
                  Terms of Use
                </Text>
                {' '}and{' '}
                <Text
                  className="text-alpha font-semibold"
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    router.push('/legal/privacy');
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            <Button
              onPress={submit}
              disabled={loading || !termsAccepted}
              loading={loading}
              variant="default"
              size="lg"
              className="mt-2"
            >
              Log in
            </Button>
          </View>

          {!isKeyboardVisible && (
            <View className="items-center pb-4">
              <Link href="/auth/forgot-password" asChild>
                <TouchableOpacity className="mb-6">
                  <Text className="text-yellow-500 dark:text-yellow-400 font-medium text-base">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </Link>

              <View className="items-center">
                <Text className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                  You do not have an account?
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://lionsgeek.ma/contact')}>
                  <Text className="text-alpha dark:text-yellow-400 font-semibold text-base">
                    Contact us
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
