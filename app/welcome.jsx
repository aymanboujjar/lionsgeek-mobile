import { View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Home as LogoIcon } from '@/components/logo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('welcome_seen', '1');
      router.replace('/auth/login');
    } catch (error) {
      console.error('[WELCOME] Error:', error);
      router.replace('/auth/login');
    }
  };

  const features = [
    {
      icon: 'grid-outline',
      title: 'Personal Dashboard',
      description: 'A personalized space for each student to track progress, access resources, and manage learning activities.',
    },
    {
      icon: 'book-outline',
      title: 'Learning Materials',
      description: 'Access curated courses, tutorials, and project files for both Full-Stack Development and Media Creation tracks.',
    },
    {
      icon: 'folder-outline',
      title: 'Project Showcase',
      description: 'Upload and share your projects, explore others\' work, and get peer or mentor feedback in a creative environment.',
    },
    {
      icon: 'people-outline',
      title: 'Community & Collaboration',
      description: 'Connect with fellow learners, join group discussions, and collaborate on real-world team projects.',
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Communication Hub',
      description: 'Stay connected through built-in messaging, announcements, and group chats with mentors and classmates.',
    },
    {
      icon: 'bar-chart-outline',
      title: 'Progress & Analytics',
      description: 'Monitor your learning journey with visual dashboards showing course completion, skill growth, and achievements.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Receive Your Access',
      description: 'After passing the Jungle challenge, you\'ll receive your MyLionsGeek login credentials directly from the LionsGeek team.',
    },
    {
      number: '02',
      title: 'Log In & Set Up',
      description: 'Sign in with your provided credentials, update your profile, and explore your personal learning dashboard.',
    },
    {
      number: '03',
      title: 'Start Learning & Sharing',
      description: 'Access your materials, manage your projects, and collaborate with your peers and mentors inside MyLionsGeek.',
    },
  ];

  const stats = [
    { icon: 'people', value: '2,500+', label: 'Active Users' },
    { icon: 'calendar', value: '15k+', label: 'Sessions Scheduled' },
    { icon: 'trophy', value: '98%', label: 'Satisfaction Rate' },
    { icon: 'time', value: '24/7', label: 'Platform Uptime' },
  ];

  const faqs = [
    {
      question: 'How do I get access to MyLionsGeek?',
      answer: 'Access is granted automatically after you pass the Jungle challenge. You\'ll receive your login credentials from the LionsGeek team via email.',
    },
    {
      question: 'Can I create my own account?',
      answer: 'No. Only accepted students and staff members receive accounts. If you haven\'t joined LionsGeek yet, apply for the next Jungle session.',
    },
    {
      question: 'What can I do inside MyLionsGeek?',
      answer: 'Students can mark attendance, access resources, and share projects. Staff can manage materials, monitor student progress, and handle studio or equipment reservations.',
    },
    {
      question: 'Who do I contact for technical issues?',
      answer: 'You can reach out to the LionsGeek support team directly through the Help section inside the platform or by email at support@lionsgeek.com.',
    },
  ];

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-4 bg-light dark:bg-dark border-b border-light/20 dark:border-dark/20">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LogoIcon color={isDark ? '#fff' : '#000'} width={40} height={40} />
              <Text className="ml-2 text-xl font-bold text-black dark:text-white">LionsGeek</Text>
            </View>
            <TouchableOpacity onPress={handleGetStarted}>
              <Text className="text-base font-semibold text-alpha">Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View className="px-6 pt-12 pb-8 bg-light dark:bg-dark">
          <Text className="text-3xl font-bold text-black dark:text-white mb-4 leading-tight">
            Manage Students & Staff Seamlessly
          </Text>
          <Text className="text-base text-beta/70 dark:text-white/70 mb-6 leading-6">
            The all-in-one platform for LionsGeek's digital learning ecosystem. Schedule classes, track progress, manage resources, and collaborate effortlessly.
          </Text>
          
          {/* Key Features */}
          <View className="mb-6">
            {[
              'Real-time scheduling',
              'Performance analytics',
              'Attendance tracking',
              'Instant notifications',
            ].map((feature, idx) => (
              <View key={idx} className="flex-row items-center mb-3">
                <View className="w-5 h-5 rounded-full bg-alpha items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={12} color="#000" />
                </View>
                <Text className="text-base text-beta dark:text-white/80 flex-1">
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Get Started Button */}
          <Pressable
            onPress={handleGetStarted}
            className="bg-alpha rounded-xl py-4 px-6 mb-6 active:opacity-80"
          >
            <Text className="text-center text-black font-bold text-base">
              Get Started
            </Text>
          </Pressable>

          {/* Stats */}
          <View className="flex-row justify-between pt-6 border-t border-light/20 dark:border-dark/20">
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-black dark:text-white">2.5k+</Text>
              <Text className="text-xs text-beta/70 dark:text-white/60 mt-1">Active Students</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-black dark:text-white">150+</Text>
              <Text className="text-xs text-beta/70 dark:text-white/60 mt-1">Staff Members</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-black dark:text-white">98%</Text>
              <Text className="text-xs text-beta/70 dark:text-white/60 mt-1">Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View className="px-6 py-8 bg-light/50 dark:bg-dark_gray">
          <Text className="text-sm font-semibold text-alpha mb-2 uppercase tracking-wide">
            Powerful Features
          </Text>
          <Text className="text-2xl font-bold text-black dark:text-white mb-2">
            Everything you need in one place
          </Text>
          <Text className="text-base text-beta/70 dark:text-white/70 mb-6">
            Streamline your educational operations with our comprehensive platform.
          </Text>

          <View>
            {features.map((feature, idx) => (
              <View
                key={idx}
                className={`bg-light dark:bg-dark_gray rounded-xl p-4 border border-light/20 dark:border-dark/20 ${idx < features.length - 1 ? 'mb-4' : ''}`}
              >
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-full bg-alpha/10 dark:bg-alpha/20 items-center justify-center mr-4">
                    <Ionicons name={feature.icon} size={24} color="#ffc801" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-black dark:text-white mb-2">
                      {feature.title}
                    </Text>
                    <Text className="text-sm text-beta/70 dark:text-white/70 leading-5">
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section */}
        <View className="px-6 py-8 bg-light dark:bg-dark">
          <Text className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
            How MyLionsGeek Works
          </Text>
          <View>
            {steps.map((step, idx) => (
              <View key={idx} className={`flex-row items-start ${idx < steps.length - 1 ? 'mb-6' : ''}`}>
                <View className="w-16 h-16 rounded-full bg-alpha items-center justify-center mr-4">
                  <Text className="text-2xl font-bold text-black">{step.number}</Text>
                </View>
                <View className="flex-1 pt-2">
                  <Text className="text-lg font-semibold text-black dark:text-white mb-2">
                    {step.title}
                  </Text>
                  <Text className="text-sm text-beta/70 dark:text-white/70 leading-5">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* For Students & Staff Section */}
        <View className="px-6 py-8 bg-light/50 dark:bg-dark_gray">
          <View>
            {/* For Students */}
            <View className="bg-alpha rounded-2xl p-6 mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-black/10 items-center justify-center mr-4">
                  <Ionicons name="book-outline" size={24} color="#000" />
                </View>
                <Text className="text-xl font-bold text-black">For Students</Text>
              </View>
              <View>
                {[
                  'Access learning materials and resources for your program',
                  'Mark your attendance directly from your personal dashboard',
                  'Upload and share your creative or development projects',
                  'Collaborate with peers and mentors through dedicated spaces',
                  'Track your progress and stay updated with announcements',
                ].map((item, idx) => (
                  <View key={idx} className={`flex-row items-start ${idx < 4 ? 'mb-3' : ''}`}>
                    <Ionicons name="checkmark-circle" size={20} color="#000" style={{ marginRight: 8, marginTop: 2 }} />
                    <Text className="text-sm text-black/90 flex-1 leading-5">{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* For Staff */}
            <View className="bg-beta dark:bg-dark_gray rounded-2xl p-6">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mr-4">
                  <Ionicons name="person-outline" size={24} color="#fff" />
                </View>
                <Text className="text-xl font-bold text-white">For Staff</Text>
              </View>
              <View>
                {[
                  'Manage students and oversee their progress efficiently',
                  'Organize and monitor studio and equipment reservations',
                  'Track and validate student attendance records',
                  'Upload and update course materials and resources',
                  'Coordinate team operations and manage shared assets like cameras or studios',
                ].map((item, idx) => (
                  <View key={idx} className={`flex-row items-start ${idx < 4 ? 'mb-3' : ''}`}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8, marginTop: 2 }} />
                    <Text className="text-sm text-white/90 flex-1 leading-5">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Impact Section */}
        <View className="px-6 py-8 bg-light dark:bg-dark">
          <Text className="text-2xl font-bold text-black dark:text-white mb-2 text-center">
            Making an impact
          </Text>
          <Text className="text-base text-beta/70 dark:text-white/70 mb-6 text-center">
            Numbers that speak to our commitment to excellence in digital education
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {stats.map((stat, idx) => (
              <View
                key={idx}
                className="w-[48%] bg-light/50 dark:bg-dark_gray rounded-xl p-4 mb-4 border border-light/20 dark:border-dark/20"
              >
                <View className="w-12 h-12 rounded-full bg-alpha/10 dark:bg-alpha/20 items-center justify-center mb-3">
                  <Ionicons name={stat.icon} size={24} color="#ffc801" />
                </View>
                <Text className="text-2xl font-bold text-black dark:text-white mb-1">
                  {stat.value}
                </Text>
                <Text className="text-xs text-beta/70 dark:text-white/60">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View className="px-6 py-8 bg-light/50 dark:bg-dark_gray">
          <Text className="text-2xl font-bold text-black dark:text-white mb-2">
            Frequently Asked Questions
          </Text>
          <Text className="text-base text-beta/70 dark:text-white/70 mb-6">
            Everything you need to know about accessing and managing your learning space
          </Text>
          <View>
            {faqs.map((faq, idx) => (
              <View
                key={idx}
                className={`bg-light dark:bg-dark_gray rounded-xl p-4 border border-light/20 dark:border-dark/20 ${idx < faqs.length - 1 ? 'mb-4' : ''}`}
              >
                <Text className="text-base font-semibold text-black dark:text-white mb-2">
                  {faq.question}
                </Text>
                <Text className="text-sm text-beta/70 dark:text-white/70 leading-5">
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 bg-light dark:bg-dark border-t border-light/20 dark:border-dark/20">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <LogoIcon color={isDark ? '#fff' : '#000'} width={32} height={32} />
              <Text className="ml-2 text-lg font-bold text-black dark:text-white">LionsGeek</Text>
            </View>
          </View>
          <Text className="text-sm text-beta/70 dark:text-white/60 mb-4">
            © 2026 LionsGeek. All rights reserved.
          </Text>
          <View className="flex-row">
            <TouchableOpacity className="mr-4">
              <Text className="text-sm text-beta/70 dark:text-white/60">Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity className="mr-4">
              <Text className="text-sm text-beta/70 dark:text-white/60">LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-sm text-beta/70 dark:text-white/60">YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom CTA */}
        <View className="px-6 py-6 bg-alpha">
          <Pressable
            onPress={handleGetStarted}
            className="bg-beta dark:bg-dark rounded-xl py-4 active:opacity-80"
          >
            <Text className="text-center text-white font-bold text-base">
              Get Started Now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

