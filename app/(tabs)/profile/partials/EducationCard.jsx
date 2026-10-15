import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EducationFormModal from '../_components/EducationFormModal';
import useDeleteProfileEntry from '../_components/useDeleteProfileEntry';
import EntryActionsMenu from '../_components/EntryActionsMenu';
import { formatPeriod, formatPeriodFromParts } from '@/utils/profileHelpers';

export default function EducationCard({
  profile,
  isDark,
  isOwnProfile,
  token,
  onEducationAdded,
  onEducationUpdated,
  onEducationDeleted,
}) {
  const rawList =
    profile?.education ??
    profile?.educations ??
    profile?.user_education ??
    profile?.userEducation ??
    [];
  const list = Array.isArray(rawList) ? rawList.filter(Boolean) : [];

  const [formModal, setFormModal] = useState({ visible: false, education: null });

  const openAdd = () => setFormModal({ visible: true, education: null });
  const openEdit = (edu) => setFormModal({ visible: true, education: edu });
  const closeForm = () => setFormModal({ visible: false, education: null });

  const { deletingId, confirmDelete } = useDeleteProfileEntry({
    kind: 'education',
    token,
    onDeleted: (id) => onEducationDeleted?.(id),
  });

  return (
    <>
      <View className="mx-4 mb-3 rounded-2xl bg-light dark:bg-dark border border-black/10 dark:border-white/10 overflow-hidden">
        {/* ── Section header ── */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-black/5 dark:border-dark_gray">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-lg bg-alpha/15 items-center justify-center">
              <Ionicons name="school" size={14} color="#ffc801" />
            </View>
            <Text className="text-base font-bold text-black dark:text-white">Education</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {list.length > 0 && (
              <View className="px-2 py-0.5 rounded-full bg-alpha/10">
                <Text className="text-xs font-semibold text-alpha">{list.length}</Text>
              </View>
            )}
            {isOwnProfile && (
              <TouchableOpacity
                onPress={openAdd}
                hitSlop={10}
                activeOpacity={0.7}
                className="w-7 h-7 rounded-full bg-alpha items-center justify-center"
              >
                <Ionicons name="add" size={16} color="#212529" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {list.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons
              name="school-outline"
              size={36}
              color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            />
            <Text className="text-xs text-black/30 dark:text-white/30 mt-2">
              No education added yet
            </Text>
            {isOwnProfile && (
              <TouchableOpacity
                onPress={openAdd}
                activeOpacity={0.7}
                className="mt-3 px-4 py-2 rounded-full bg-alpha/15 flex-row items-center gap-1"
              >
                <Ionicons name="add-circle-outline" size={15} color="#ffc801" />
                <Text className="text-xs font-bold text-alpha">Add Education</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="px-4 pt-4 pb-2">
            {list.map((edu, idx) => {
              const institution =
                edu?.institution ?? edu?.school ?? edu?.university ?? edu?.college ?? 'School';
              const degree = edu?.degree ?? edu?.diploma ?? edu?.level ?? null;
              const field =
                edu?.field ?? edu?.field_of_study ?? edu?.specialization ?? edu?.major ?? null;
              const startDate = edu?.start_date ?? edu?.from ?? edu?.started_at ?? null;
              const endDate = edu?.end_date ?? edu?.to ?? edu?.ended_at ?? null;
              const startMonth = edu?.start_month ?? edu?.startMonth ?? null;
              const startYear = edu?.start_year ?? edu?.startYear ?? null;
              const endMonth = edu?.end_month ?? edu?.endMonth ?? null;
              const endYear = edu?.end_year ?? edu?.endYear ?? null;
              const hasExplicitEnd = !!(endDate || endYear);
              const isCurrent = edu?.is_current ?? edu?.current ?? !hasExplicitEnd;
              const description = edu?.description ?? edu?.activities ?? null;
              const period =
                formatPeriod(startDate, endDate, isCurrent) ??
                formatPeriodFromParts(startMonth, startYear, endMonth, endYear, isCurrent);
              const isLast = idx === list.length - 1;

              return (
                <View
                  key={edu?.id ?? idx}
                  className={`flex-row ${!isLast ? 'pb-5 mb-4 border-b border-black/5 dark:border-dark_gray' : 'pb-2'}`}
                >
                  {/* School icon badge */}
                  <View className="w-12 h-12 rounded-xl bg-alpha/10 items-center justify-center mr-3 mt-0.5 shrink-0">
                    <Ionicons name="school-outline" size={20} color="#ffc801" />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="text-sm font-bold text-black dark:text-white flex-1 leading-snug">
                        {institution}
                      </Text>
                      {/* Edit / delete menu — own profile only */}
                      {isOwnProfile && (
                        <EntryActionsMenu
                          isDark={isDark}
                          title={institution}
                          onEdit={() => openEdit(edu)}
                          onDelete={() => confirmDelete(edu)}
                          deleting={deletingId != null && String(deletingId) === String(edu?.id)}
                        />
                      )}
                    </View>
                    {degree || field ? (
                      <Text className="text-sm text-black/60 dark:text-white/60 mt-0.5">
                        {[degree, field].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                    {period ? (
                      <Text className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                        {period}
                      </Text>
                    ) : null}
                    {description ? (
                      <Text
                        className="text-sm text-beta dark:text-white mt-1.5 leading-[20px]"
                        numberOfLines={3}
                      >
                        {description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Add / Edit modal (also hosts delete) ── */}
      <EducationFormModal
        visible={formModal.visible}
        education={formModal.education}
        token={token}
        isDark={isDark}
        onClose={closeForm}
        onSaved={(saved) => {
          if (formModal.education) {
            onEducationUpdated?.(saved);
          } else {
            onEducationAdded?.(saved);
          }
        }}
        onDeleted={(id) => onEducationDeleted?.(id)}
      />
    </>
  );
}
