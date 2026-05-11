import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Mail,
  Phone,
  User,
  XCircle,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { adminRepository } from '@/repositories/admin.repository';
import { useAuthStore, selectProfile } from '@/stores/auth.store';
import type { ProviderVerification } from '@/repositories/admin.repository';
import type { DocumentType } from '@/types/database.types';
import type { AdminVerificationStackScreenProps } from '@/types/navigation.types';

type Props = AdminVerificationStackScreenProps<'VerificationDetail'>;

const DOC_LABELS: Record<DocumentType, string> = {
  government_id: 'Government ID',
  proof_of_residence: 'Proof of Residence',
  police_clearance: 'Police Clearance',
  drivers_license: "Driver's License",
};

export function VerificationDetailScreen({ route, navigation }: Props) {
  const { providerId } = route.params;
  const adminProfile = useAuthStore(selectProfile);
  const [verification, setVerification] = useState<ProviderVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const rejectInputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getVerificationDetail(providerId);
      setVerification(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load verification');
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = useCallback(() => {
    if (!verification || !adminProfile) return;
    Alert.alert(
      'Approve Verification',
      `Approve ${verification.user.name} as a verified provider?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setIsActing(true);
            try {
              await adminRepository.approveVerification(providerId, adminProfile.id);
              Alert.alert('Approved', `${verification.user.name} has been verified.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to approve');
            } finally {
              setIsActing(false);
            }
          },
        },
      ],
    );
  }, [verification, adminProfile, providerId, navigation]);

  const handleRejectSubmit = useCallback(async () => {
    if (!adminProfile || !rejectReason.trim()) {
      Alert.alert('Reason required', 'Please provide a rejection reason.');
      return;
    }
    setRejectModalVisible(false);
    setIsActing(true);
    try {
      await adminRepository.rejectVerification(providerId, adminProfile.id, rejectReason.trim());
      Alert.alert('Rejected', 'Verification has been rejected and the provider notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to reject');
    } finally {
      setIsActing(false);
      setRejectReason('');
    }
  }, [adminProfile, rejectReason, providerId, navigation]);

  const openDocument = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open document.'),
    );
  }, []);

  const pendingDocs = verification?.documents.filter((d) => d.status === 'pending') ?? [];
  const canAct = pendingDocs.length > 0 && !isActing;

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-9 h-9 rounded-xl items-center justify-center active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={Colors.primary} />
        </Pressable>
        <Text className="flex-1 text-base font-bold text-gray-900 ml-2">
          Verification Review
        </Text>
        {isActing && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View className="mx-4 mt-4 p-3 bg-red-50 rounded-xl">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      ) : !verification ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-gray-500">Verification not found</Text>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Provider Card */}
            <View className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 p-4">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Provider Details
              </Text>
              <View className="flex-row items-center gap-3">
                {verification.user.profile_image_url ? (
                  <Image
                    source={{ uri: verification.user.profile_image_url }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
                    <User size={26} color={Colors.gray400} />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">
                    {verification.user.name}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Mail size={12} color={Colors.gray400} />
                    <Text className="text-xs text-gray-500">{verification.user.email}</Text>
                  </View>
                  {verification.user.phone ? (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Phone size={12} color={Colors.gray400} />
                      <Text className="text-xs text-gray-500">{verification.user.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Documents */}
            <View className="bg-white mx-4 mt-3 rounded-2xl border border-gray-100 p-4">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Submitted Documents ({verification.documents.length})
              </Text>
              <View className="gap-2">
                {verification.documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    label={DOC_LABELS[doc.document_type] ?? doc.document_type}
                    fileName={doc.file_name}
                    status={doc.status}
                    submittedAt={doc.submitted_at}
                    rejectionReason={doc.rejection_reason}
                    onView={() => openDocument(doc.file_url)}
                  />
                ))}
              </View>
            </View>

            <View className="h-32" />
          </ScrollView>

          {/* Action Buttons */}
          {canAct ? (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setRejectModalVisible(true);
                  setTimeout(() => rejectInputRef.current?.focus(), 200);
                }}
                className="flex-1 h-12 rounded-xl border-2 border-red-200 bg-red-50 items-center justify-center flex-row gap-2 active:opacity-75"
                accessibilityRole="button"
                accessibilityLabel="Reject verification"
              >
                <XCircle size={18} color={Colors.error} />
                <Text className="text-sm font-bold text-red-600">Reject</Text>
              </Pressable>
              <Pressable
                onPress={handleApprove}
                className="flex-1 h-12 rounded-xl bg-[#111111] items-center justify-center flex-row gap-2 active:opacity-75"
                accessibilityRole="button"
                accessibilityLabel="Approve verification"
              >
                <CheckCircle size={18} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">Approve</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-4 pt-5 pb-8">
            <Text className="text-base font-bold text-gray-900 mb-1">Rejection Reason</Text>
            <Text className="text-xs text-gray-500 mb-3">
              This reason will be sent to the provider.
            </Text>
            <TextInput
              ref={rejectInputRef}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 min-h-[100px]"
              placeholder="Explain why this application is being rejected…"
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectReason('');
                }}
                className="flex-1 h-12 rounded-xl border border-gray-200 items-center justify-center active:opacity-75"
                accessibilityRole="button"
                accessibilityLabel="Cancel rejection"
              >
                <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className={`flex-1 h-12 rounded-xl items-center justify-center active:opacity-75 ${
                  rejectReason.trim() ? 'bg-red-600' : 'bg-red-200'
                }`}
                accessibilityRole="button"
                accessibilityLabel="Submit rejection"
              >
                <Text className="text-sm font-bold text-white">Submit Rejection</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DocumentCard({
  label,
  fileName,
  status,
  submittedAt,
  rejectionReason,
  onView,
}: {
  label: string;
  fileName: string;
  status: string;
  submittedAt: string;
  rejectionReason: string | null;
  onView: () => void;
}) {
  const statusColor =
    status === 'approved'
      ? Colors.success
      : status === 'rejected'
        ? Colors.error
        : Colors.warning;

  const statusLabel =
    status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';

  return (
    <View className="border border-gray-100 rounded-xl p-3">
      <View className="flex-row items-start gap-3">
        <View className="w-9 h-9 rounded-lg bg-gray-50 items-center justify-center mt-0.5">
          <FileText size={18} color={Colors.gray500} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">{label}</Text>
          <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
            {fileName}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            Submitted {format(new Date(submittedAt), 'dd MMM yyyy')}
          </Text>
          {rejectionReason ? (
            <Text className="text-xs text-red-500 mt-1">Reason: {rejectionReason}</Text>
          ) : null}
        </View>
        <View className="items-end gap-1.5">
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}20` }}>
            <Text className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabel}
            </Text>
          </View>
          <Pressable
            onPress={onView}
            className="flex-row items-center gap-1 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={`View ${label}`}
          >
            <Download size={13} color={Colors.info} />
            <Text className="text-xs font-medium text-blue-600">View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
