import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PROFILE_TABS = [
  { icon: 'grid-outline',      activeIcon: 'grid',      label: 'Posts'   },
  { icon: 'briefcase-outline', activeIcon: 'briefcase', label: 'Resume'  },
  { icon: 'repeat-outline',    activeIcon: 'repeat',    label: 'Reposts' },
  { icon: 'bookmark-outline',  activeIcon: 'bookmark',  label: 'Saved Posts' },
];

export default function ProfileTabBar({ activeTab, onTabChange, isDark }) {
  return (
    <View
      className="flex-row bg-light dark:bg-dark"
      style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
    >
      {PROFILE_TABS.map((tab, index) => {
        const isActive = activeTab === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onTabChange(index)}
            activeOpacity={0.7}
            className="flex-1 items-center py-3"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: isActive ? '#ffc801' : 'transparent',
            }}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={20}
              color={isActive ? '#ffc801' : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)')}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                marginTop: 3,
                color: isActive ? '#ffc801' : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
