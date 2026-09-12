import { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';

export const REPORT_REASON_PRESETS = [
  { id: 'spam', label: 'Spam', reason: 'Spam or misleading content' },
  { id: 'harassment', label: 'Harassment or bullying', reason: 'Harassment or bullying' },
  { id: 'hate', label: 'Hate speech', reason: 'Hate speech or discriminatory content' },
  { id: 'threats', label: 'Threats or violence', reason: 'Threats or violence' },
  {
    id: 'sexual',
    label: 'Sexual or inappropriate',
    reason: 'Sexual or inappropriate content',
  },
  { id: 'other', label: 'Other', reason: null },
];

/**
 * Shared report-reason sheet used for posts and users.
 * Always produces a reason string of at least 10 characters for the API.
 */
export default function ReportReasonModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
  title = 'Report',
  isDark = false,
}) {
  const [selectedId, setSelectedId] = useState('harassment');
  const [otherDetail, setOtherDetail] = useState('');

  const textColor = isDark ? '#f5f5f5' : '#111';
  const mutedColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const modalBg = isDark ? '#1c1c1c' : '#ffffff';
  const modalBorder = isDark ? '#2e2e2e' : '#e8e5e0';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const chipActiveBg = 'rgba(255,200,1,0.18)';

  const resolvedReason = useMemo(() => {
    const preset = REPORT_REASON_PRESETS.find((p) => p.id === selectedId);
    if (!preset) return '';
    if (preset.id === 'other') {
      const detail = otherDetail.trim();
      if (detail.length >= 10) return detail;
      if (detail.length > 0) return `Other: ${detail}`.padEnd(10, '.');
      return 'Other objectionable or abusive content';
    }
    return preset.reason;
  }, [selectedId, otherDetail]);

  const canSubmit = resolvedReason.trim().length >= 10 && !submitting;

  const handleClose = () => {
    if (submitting) return;
    setSelectedId('harassment');
    setOtherDetail('');
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit?.(resolvedReason.trim());
    setSelectedId('harassment');
    setOtherDetail('');
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={handleClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={handleClose} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '75%',
          backgroundColor: modalBg,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderTopWidth: 0.5,
          borderColor: modalBorder,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderBottomWidth: 0.5,
            borderColor: modalBorder,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 999,
                backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={handleClose} style={{ padding: 6 }}>
              <Text style={{ color: mutedColor, fontWeight: '900' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: textColor, fontWeight: '900', fontSize: 16 }}>{title}</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={{ padding: 6, opacity: canSubmit ? 1 : 0.45 }}
            >
              <Text style={{ color: '#ffc801', fontWeight: '900' }}>
                {submitting ? 'Sending…' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          <Text style={{ color: mutedColor, marginBottom: 12, fontSize: 13, lineHeight: 18 }}>
            Select a reason. Reports are reviewed by the LionsGeek team.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {REPORT_REASON_PRESETS.map((preset) => {
              const active = selectedId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => setSelectedId(preset.id)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: active ? chipActiveBg : chipBg,
                    borderWidth: 1,
                    borderColor: active ? '#ffc801' : modalBorder,
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontWeight: active ? '800' : '600',
                      fontSize: 13,
                    }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedId === 'other' ? (
            <TextInput
              value={otherDetail}
              onChangeText={setOtherDetail}
              placeholder="Describe the issue (optional details)"
              placeholderTextColor={mutedColor}
              multiline
              style={{
                minHeight: 90,
                borderWidth: 1,
                borderColor: modalBorder,
                borderRadius: 12,
                padding: 12,
                color: textColor,
                textAlignVertical: 'top',
              }}
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
