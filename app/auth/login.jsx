import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import API from '@/api';
import { useAppContext } from '@/context';
import { router, Link } from 'expo-router';
import { Home as LogoIcon } from '@/components/logo';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '@/components/ui';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const { saveAuth } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    console.log('[LOGIN] Attempting login', { email });
    if (!email || !password) return setError('Please enter your credentials');
    setLoading(true);
    setError('');
    try {
      console.log('[LOGIN] Calling API.post mobile/login');
      const response = await API.post('mobile/login', { email, password });
      console.log('[LOGIN] Response received', { status: response?.status, hasData: !!response?.data });
      
      if (response?.data) {
        console.log('[LOGIN] Response data:', JSON.stringify(response.data, null, 2));
        console.log('[LOGIN] User data:', JSON.stringify(response.data.user, null, 2));
        
        // Store full user data
        await saveAuth(response.data.token, response.data.user);
        console.log('[LOGIN] Auth data saved successfully');
        router.replace('/(tabs)');
      } else {
        throw new Error('No data received');
      }
    } catch (e) {
      console.error('[LOGIN] Login failed', e);
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isDark = colorScheme === 'dark';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-12 justify-center">
          {/* Top Section - Logo */}
          <View className="items-center mt-4">
            <LogoIcon color={isDark ? '#fff' : '#000'} width={80} height={80} />
            <Text className="text-2xl font-bold text-black dark:text-white mt-3">LIONSGEEK</Text>
          </View>

          {/* Middle Section - Login Form */}
          <View className=" justify-center max-w-md w-full mx-auto " style={{ minHeight: 400 }} >
            <View className="items-center mb-8">
              <Text className="text-2xl font-semibold text-black dark:text-white">Welcome</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please enter your information</Text>
            </View>
            
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
              keyboardType="email-address"
              placeholder="email@example.com"
              error={!!error}
            />
            
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Password"
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
            
            <Button
              onPress={submit}
              disabled={loading}
              loading={loading}
              variant="default"
              size="lg"
              className="mt-2"
            >
              Log in
            </Button>
          </View>

          {/* Bottom Section - Links */}
          <View className=" items-center pb-4">
            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity className="mb-6">
                <Text className="text-yellow-500 dark:text-yellow-400 font-medium text-base">
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </Link>
            
            <View className="items-center">
              <Text className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                You don't have an account?
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://lionsgeek.ma/contact')}>
                <Text className="text-alpha dark:text-yellow-400 font-semibold text-base">
                  Contact us
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



