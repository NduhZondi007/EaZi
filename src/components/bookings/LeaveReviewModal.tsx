import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle, User, X } from 'lucide-react-native';
import { StarRating } from '@/components/ui/StarRating';
import { Colors } from '@/constants/colors';
import { reviewRepository } from '@/repositories/review.repository';
import { useAuthStore, selectUser } from '@/stores/auth.store';

interface LeaveReviewModalProps {
  visible: boolean;
  bookingId: string;
  serviceId: string;
  serviceName: string;
  providerName: string;
  providerImageUrl: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function LeaveReviewModal({
  visible,
  bookingId,
  serviceId,
  serviceName,
  providerName,
  providerImageUrl,
  onClose,
  onSubmitted,
}: LeaveReviewModalProps) {
  const user = useAuthStore(selectUser);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = rating > 0 && comment.trim().length >= 5 && !isSubmitting;

  const handleSubmit = useCallback(async () => {
    if (!user || rating === 0) return;
    if (comment.trim().length < 5) {
      Alert.alert('Too short', 'Please write at least a brief comment.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewRepository.create({
        bookingId,
        serviceId,
        userId: user.id,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
        setSubmitted(false);
        setRating(0);
        setComment('');
      }, 1400);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, rating, comment, bookingId, serviceId, onSubmitted]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setRating(0);
    setComment('');
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close review modal"
        />
        <View className="bg-white rounded-t-3xl px-4 pt-4 pb-8">
          {/* Handle bar */}
          <View className="w-10 h-1 rounded-full bg-gray-200 self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Leave a Review</Text>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={16} color={Colors.gray600} />
            </Pressable>
          </View>

          {submitted ? (
            <View className="items-center py-8">
              <CheckCircle size={52} color={Colors.success} />
              <Text className="text-base font-bold text-gray-900 mt-3">
                Review submitted!
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Thank you for your feedback.
              </Text>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Provider info */}
              <View className="flex-row items-center gap-3 bg-gray-50 rounded-xl p-3 mb-5">
                {providerImageUrl ? (
                  <Image
                    source={{ uri: providerImageUrl }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-11 h-11 rounded-full bg-gray-200 items-center justify-center">
                    <User size={20} color={Colors.gray400} />
                  </View>
                )}
                <View>
                  <Text className="text-sm font-semibold text-gray-900">{providerName}</Text>
                  <Text className="text-xs text-gray-500" numberOfLines={1}>
                    {serviceName}
                  </Text>
                </View>
              </View>

              {/* Star rating */}
              <View className="items-center mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-3">
                  How would you rate this service?
                </Text>
                <StarRating
                  value={rating}
                  size={40}
                  onRate={setRating}
                  color={Colors.warning}
                />
                {rating > 0 && (
                  <Text className="text-xs text-gray-500 mt-2">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </Text>
                )}
              </View>

              {/* Comment */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Share your experience
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 min-h-[100px]"
                  placeholder="What did you like or dislike? What could be improved?"
                  placeholderTextColor={Colors.gray400}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                />
                <Text className="text-xs text-gray-400 text-right mt-1">
                  {comment.length}/500
                </Text>
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={`h-12 rounded-xl items-center justify-center flex-row gap-2 ${
                  canSubmit ? 'bg-[#111111]' : 'bg-gray-200'
                }`}
                accessibilityRole="button"
                accessibilityLabel="Submit review"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className={`text-sm font-bold ${canSubmit ? 'text-white' : 'text-gray-400'}`}
                  >
                    Submit Review
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
