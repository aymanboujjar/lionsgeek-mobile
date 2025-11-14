import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import API from '@/api';
import AppLayout from '@/components/layout/AppLayout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppContext } from '@/context';

export default function ReservationDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAppContext();

  useEffect(() => {
    const fetchReservation = async () => {
      try {
       
        const res = await API.getWithAuth(`mobile/reservations/${id}`, token);
        // console.log(res.data.reservation);
        
        setReservation(res.data.reservation);
      } catch (error) {
        console.error('Error fetching reservation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReservation();
  }, [id]);

  if (loading) return (
    <AppLayout>
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#ffc801" />
      </View>
    </AppLayout>
  );

  if (!reservation) return (
    <AppLayout>
      <View className="flex-1 justify-center items-center px-4">
        <Text className={`text-center text-lg ${isDark ? 'text-light' : 'text-beta'} mt-8`}>Reservation not found</Text>
      </View>
    </AppLayout>
  );

  const getStatusStyles = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('approve')) {
      return isDark 
        ? 'bg-good/20 text-good border-good/30' 
        : 'bg-good/10 text-good border-good';
    }
    if (normalized.includes('pending')) {
      return isDark 
        ? 'bg-alpha/20 text-alpha border-alpha/30' 
        : 'bg-alpha/10 text-alpha border-alpha';
    }
    if (normalized.includes('reject') || normalized.includes('cancel')) {
      return isDark 
        ? 'bg-error/20 text-error border-error/30' 
        : 'bg-error/10 text-error border-error';
    }
    return isDark 
      ? 'bg-dark_gray text-light border-dark_gray' 
      : 'bg-light text-beta border-beta';
  };

  const baseUrl = (API?.APP_URL || '').replace(/\/+$/, '');

  const getImageUri = (item) => {
    if (!item) return null;
    if (typeof item === 'string') {
      const cleaned = item.trim().replace(/^@+/, '');
      if (!cleaned) return null;
      if (/^https?:\/\//i.test(cleaned)) {
        try {
          return encodeURI(cleaned);
        } catch {
          return cleaned;
        }
      }
      // Relative paths from API (e.g., "storage/..." or "img/...")
      const path = cleaned.replace(/^\/+/, '');
      if (path.startsWith('storage/')) {
        return `${baseUrl}/${path}`;
      }
      if (path.startsWith('img/')) {
        return `${baseUrl}/storage/${path}`;
      }
      return `${baseUrl}/${path}`;
    }
    if (typeof item === 'object') {
      return item.url || item.uri || item.image || item.image_url || item.path || null;
    }
    return null;
  };

  const Thumbnail = ({ uri, size = 48, radius = 12 }) => {
    const [hasError, setHasError] = useState(false);
    const normalized = getImageUri(uri);
    if (!normalized || hasError) {
      return (
        <View
          style={{ height: size, width: size, borderRadius: radius }}
          className="overflow-hidden bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-white"
        />
      );
    }
    return (
      <Image
        source={{ uri: normalized }}
        style={{ height: size, width: size, borderRadius: radius }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  };

  const getApproverName = (res) => {
    if (!res) return null;
    const c = (v) => (typeof v === 'string' ? v.trim() : v);
    const direct = c(res.approver_name) || c(res.approved_by) || c(res.approver) || c(res.approverName);
    if (direct && typeof direct === 'string' && direct.length > 0) return direct;
    if (res.approver && typeof res.approver === 'object') {
      const fromObj = c(res.approver.name) || c(res.approver.full_name) || c(res.approver.username);
      if (fromObj && typeof fromObj === 'string' && fromObj.length > 0) return fromObj;
    }
    return null;
  };

  return (
    <AppLayout>
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className={`text-3xl font-bold ${isDark ? 'text-light' : 'text-beta'} mb-4`}>{reservation.title}</Text>

          <View className="flex-row items-center gap-2 flex-wrap">
            <View className={`px-4 py-2 rounded-full border ${getStatusStyles(reservation.status)}`}>
              <Text className={`text-xs font-bold uppercase tracking-wide`}>{reservation.status}</Text>
            </View>
            {reservation.type ? (
              <View className={`px-4 py-2 rounded-full border ${isDark ? 'bg-alpha/20 text-alpha border-alpha/30' : 'bg-alpha/10 text-alpha border-alpha'}`}>
                <Text className="text-xs font-bold uppercase tracking-wide">{reservation.type}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Details Card */}
        <View className={`${isDark ? 'bg-dark_gray' : 'bg-light'} rounded-2xl border ${isDark ? 'border-dark' : 'border-beta/20'}`} style={{ padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 pr-3">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-light/60' : 'text-beta/60'} mb-1`}>Date</Text>
              <Text className={`${isDark ? 'text-light' : 'text-beta'} text-lg font-bold`}>{reservation.day}</Text>
            </View>
            <View className={`w-px ${isDark ? 'bg-dark' : 'bg-beta/20'}`} />
            <View className="flex-1 px-3">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-light/60' : 'text-beta/60'} mb-1`}>Start</Text>
              <Text className={`${isDark ? 'text-light' : 'text-beta'} text-lg font-bold`}>{reservation.start}</Text>
            </View>
            <View className={`w-px ${isDark ? 'bg-dark' : 'bg-beta/20'}`} />
            <View className="flex-1 pl-3">
              <Text className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-light/60' : 'text-beta/60'} mb-1`}>End</Text>
              <Text className={`${isDark ? 'text-light' : 'text-beta'} text-lg font-bold`}>{reservation.end}</Text>
            </View>
          </View>

          <View className={`h-px ${isDark ? 'bg-dark' : 'bg-beta/20'} my-4`} />

          <View className="flex-row gap-3 flex-wrap">
            {reservation.studio_name ? (
              <View className={`px-4 py-3 rounded-xl ${isDark ? 'bg-dark border-dark' : 'bg-light border-beta/20'} border`}>
                <Text className={`text-xs font-semibold ${isDark ? 'text-light/60' : 'text-beta/60'} mb-1`}>Studio</Text>
                <Text className={`text-sm font-bold ${isDark ? 'text-light' : 'text-beta'}`}>{reservation.studio_name}</Text>
              </View>
            ) : null}
            <View className={`px-4 py-3 rounded-xl ${isDark ? 'bg-dark border-dark' : 'bg-light border-beta/20'} border`}>
              <Text className={`text-xs font-semibold ${isDark ? 'text-light/60' : 'text-beta/60'} mb-1`}>Approved by</Text>
              <Text className={`text-sm font-bold ${isDark ? 'text-light' : 'text-beta'}`}>
                {getApproverName(reservation) || (String(reservation.status || '').toLowerCase().includes('pending') ? 'Pending' : '—')}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipment */}
        <View className="mb-6">
          <Text className={`text-xl font-bold ${isDark ? 'text-light' : 'text-beta'} mb-4`}>Equipment</Text>
          {Array.isArray(reservation.equipments) && reservation.equipments.length > 0 ? (
            <View className={`${isDark ? 'bg-dark_gray' : 'bg-light'} rounded-2xl border ${isDark ? 'border-dark' : 'border-beta/20'}`} style={{ padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              {reservation.equipments.map((eq, idx) => {
                const thumb = getImageUri(eq?.image);
                return (
                  <View key={eq.id ?? idx} className={`flex-row items-center justify-between py-3 border-b ${isDark ? 'border-dark' : 'border-beta/20'} last:border-b-0`}>
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <Thumbnail uri={thumb} size={56} radius={12} />
                      <Text className={`text-base font-semibold ${isDark ? 'text-light' : 'text-beta'} flex-1`} numberOfLines={1}>
                        {eq.name}
                      </Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-dark border-dark' : 'bg-light border-beta/20'} border`}>
                      <Text className={`text-xs font-semibold ${isDark ? 'text-light/80' : 'text-beta/80'}`}>{eq.type_name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className={`${isDark ? 'bg-dark_gray' : 'bg-light'} rounded-xl p-6 items-center border ${isDark ? 'border-dark' : 'border-beta/20'}`}>
              <Text className={`text-sm ${isDark ? 'text-light/60' : 'text-beta/60'}`}>No equipment listed</Text>
            </View>
          )}
        </View>

        {/* Attachments / Images */}
        {Array.isArray(reservation.images) && reservation.images.length > 0 ? (
          <View className="mb-6">
            <Text className={`text-xl font-bold ${isDark ? 'text-light' : 'text-beta'} mb-4`}>Images</Text>
            <View className={`${isDark ? 'bg-dark_gray' : 'bg-light'} rounded-2xl border ${isDark ? 'border-dark' : 'border-beta/20'}`} style={{ padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {reservation.images.map((img, idx) => {
                  const uri = getImageUri(img);
                  if (!uri) return null;
                  return (
                    <View key={idx} className={`rounded-xl overflow-hidden ${isDark ? 'bg-dark border-dark' : 'bg-light border-beta/20'} border`} style={{ height: 180, width: 240, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}>
                      <Thumbnail uri={uri} size={180} radius={12} />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : null}

        {/* Team Members */}
        <View className="mb-6">
          <Text className={`text-xl font-bold ${isDark ? 'text-light' : 'text-beta'} mb-4`}>Team Members</Text>
          {Array.isArray(reservation.members) && reservation.members.length > 0 ? (
            <View className={`${isDark ? 'bg-dark_gray' : 'bg-light'} rounded-2xl border ${isDark ? 'border-dark' : 'border-beta/20'}`} style={{ padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
              {reservation.members.map((member, idx) => (
                <View key={`${member.email}-${idx}`} className={`flex-row items-center justify-between py-3 border-b ${isDark ? 'border-dark' : 'border-beta/20'} last:border-b-0`}>
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <Thumbnail uri={member.avatar} size={48} radius={999} />
                    <Text className={`text-base font-semibold ${isDark ? 'text-light' : 'text-beta'} flex-1`} numberOfLines={1}>{member.name}</Text>
                  </View>
                  <View className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-dark border-dark' : 'bg-light border-beta/20'} border`}>
                    <Text className={`text-xs font-semibold ${isDark ? 'text-light/80' : 'text-beta/80'}`}>{member.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={`${isDark ? 'bg-dark_gray' : 'bg-light'} rounded-xl p-6 items-center border ${isDark ? 'border-dark' : 'border-beta/20'}`}>
              <Text className={`text-sm ${isDark ? 'text-light/60' : 'text-beta/60'}`}>No team members listed</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </AppLayout>
  );
}
