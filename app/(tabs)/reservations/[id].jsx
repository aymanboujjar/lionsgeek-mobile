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
        console.log(res.data.reservation);
        
        setReservation(res.data.reservation);
      } catch (error) {
        console.error('Error fetching reservation:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReservation();
  }, [id]);

  if (loading) return <AppLayout><ActivityIndicator size="large" /></AppLayout>;

  if (!reservation) return (
    <AppLayout>
      <Text className="text-center text-black dark:text-white mt-8">Reservation not found</Text>
    </AppLayout>
  );

  const getStatusStyles = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('approve')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-black dark:text-white dark:border-white border-emerald-300/30';
    }
    if (normalized.includes('pending')) {
      return 'bg-amber-100 text-amber-800 dark:bg-black dark:text-white dark:border-white border-amber-300/30';
    }
    if (normalized.includes('reject') || normalized.includes('cancel')) {
      return 'bg-rose-100 text-rose-800 dark:bg-black dark:text-white dark:border-white border-rose-300/30';
    }
    return 'bg-neutral-100 text-neutral-800 dark:bg-black dark:text-white dark:border-white border-neutral-300/30';
  };

  const getStatusTextStyles = () => 'text-neutral-800 dark:text-white';

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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-black dark:text-white mb-2">{reservation.title}</Text>

          <View className="flex-row items-center gap-2">
            <View className={`px-3 py-1 rounded-full border ${getStatusStyles(reservation.status)}`}>
              <Text className={`text-xs font-semibold uppercase tracking-wide ${getStatusTextStyles(reservation.status)}`}>{reservation.status}</Text>
            </View>
            {reservation.type ? (
              <View className="px-3 py-1 rounded-full border bg-blue-100 text-blue-800 dark:bg-black dark:text-white dark:border-white border-blue-300/30">
                <Text className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-white">{reservation.type}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Details Card */}
        <View className="bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-white shadow-sm p-4 mb-6">
          <View className="flex-row justify-between mb-3">
            <View className="flex-1 pr-2">
              <Text className="text-neutral-500 dark:text-white text-xs">Date</Text>
              <Text className="text-black dark:text-white text-base mt-0.5">{reservation.day}</Text>
            </View>
            <View className="w-px bg-neutral-200 dark:bg-white" />
            <View className="flex-1 px-2">
              <Text className="text-neutral-500 dark:text-white text-xs">Start</Text>
              <Text className="text-black dark:text-white text-base mt-0.5">{reservation.start}</Text>
            </View>
            <View className="w-px bg-neutral-200 dark:bg-white" />
            <View className="flex-1 pl-2">
              <Text className="text-neutral-500 dark:text-white text-xs">End</Text>
              <Text className="text-black dark:text-white text-base mt-0.5">{reservation.end}</Text>
            </View>
          </View>

          <View className="h-px bg-neutral-200 dark:bg-white my-3" />

          <View className="flex-row gap-3 flex-wrap">
            {reservation.studio_name ? (
              <View className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white">
                <Text className="text-xs text-neutral-700 dark:text-white">Studio</Text>
                <Text className="text-sm font-medium text-black dark:text-white">{reservation.studio_name}</Text>
              </View>
            ) : null}
            <View className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white">
              <Text className="text-xs text-neutral-700 dark:text-white">Approved by</Text>
              <Text className="text-sm font-medium text-black dark:text-white">
                {getApproverName(reservation) || (String(reservation.status || '').toLowerCase().includes('pending') ? 'Pending' : '—')}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipment */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-black dark:text-white mb-3">Equipment</Text>
          {Array.isArray(reservation.equipments) && reservation.equipments.length > 0 ? (
            <View className="bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-white p-4 gap-2">
              {reservation.equipments.map((eq, idx) => {
                const thumb = getImageUri(eq?.image);
                return (
                  <View key={eq.id ?? idx} className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <Thumbnail uri={thumb} size={48} radius={10} />
                      <Text className="text-sm text-black dark:text-white flex-1" numberOfLines={1}>
                        {eq.name}
                      </Text>
                    </View>
                    <View className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white">
                      <Text className="text-xs text-neutral-700 dark:text-white">{eq.type_name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text className="text-sm text-neutral-500 dark:text-white">No equipment listed</Text>
          )}
        </View>

        {/* Attachments / Images */}
        {Array.isArray(reservation.images) && reservation.images.length > 0 ? (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-black dark:text-white mb-3">Images</Text>
            <View className="bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-white p-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {reservation.images.map((img, idx) => {
                  const uri = getImageUri(img);
                  if (!uri) return null;
                  return (
                    <View key={idx} className="rounded-xl overflow-hidden bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-white" style={{ height: 160, width: 224 }}>
                      <Thumbnail uri={uri} size={160} radius={12} />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        ) : null}

        {/* Team Members */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-black dark:text-white mb-3">Team Members</Text>
          {Array.isArray(reservation.members) && reservation.members.length > 0 ? (
            <View className="bg-white dark:bg-black rounded-2xl border border-neutral-200 dark:border-white p-4">
              {reservation.members.map((member, idx) => (
                <View key={`${member.email}-${idx}`} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <Thumbnail uri={member.avatar} size={40} radius={999} />
                    <Text className="text-sm text-black dark:text-white flex-1" numberOfLines={1}>{member.name}</Text>
                  </View>
                  <View className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white">
                    <Text className="text-xs text-neutral-700 dark:text-white">{member.role}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-neutral-500 dark:text-white">No team members listed</Text>
          )}
        </View>

      </ScrollView>
    </AppLayout>
  );
}
