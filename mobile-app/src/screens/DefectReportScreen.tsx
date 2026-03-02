import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { defectApiService, SubmitDefectRequest } from '../services/defect-api.service';

interface ValidationErrors {
  title?: string;
  description?: string;
}

export default function DefectReportScreen({ route, navigation }: any) {
  const { userId } = route.params || { userId: 'demo-user-123' };

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  /**
   * Real-time validation for title
   */
  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Title is required';
    }
    if (value.trim().length < 5) {
      return 'Title must be at least 5 characters';
    }
    if (value.length > 200) {
      return 'Title must not exceed 200 characters';
    }
    return undefined;
  };

  /**
   * Real-time validation for description
   */
  const validateDescription = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Description is required';
    }
    if (value.trim().length < 10) {
      return 'Description must be at least 10 characters';
    }
    if (value.length > 5000) {
      return 'Description must not exceed 5000 characters';
    }
    return undefined;
  };

  /**
   * Handle field blur to mark as touched
   */
  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev: Set<string>) => new Set(prev).add(fieldName));
  };

  /**
   * Handle title change with validation
   */
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touchedFields.has('title')) {
      const error = validateTitle(value);
      setValidationErrors((prev: ValidationErrors) => ({ ...prev, title: error }));
    }
  };

  /**
   * Handle description change with validation
   */
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (touchedFields.has('description')) {
      const error = validateDescription(value);
      setValidationErrors((prev: ValidationErrors) => ({ ...prev, description: error }));
    }
  };

  /**
   * Validate all fields before submission
   */
  const validateForm = (): boolean => {
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);

    setValidationErrors({
      title: titleError,
      description: descriptionError,
    });

    return !titleError && !descriptionError;
  };

  /**
   * Auto-capture device information
   */
  const captureDeviceInfo = () => {
    // Use the static method from DefectAPIService class
    return {
      platform: Platform.OS as 'android' | 'ios',
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0', // This should come from app.json or expo-constants
      deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
    };
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouchedFields(new Set(['title', 'description']));

    // Validate form
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission data
      const submitData: SubmitDefectRequest = {
        userId,
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim() || undefined,
        deviceInfo: captureDeviceInfo(),
      };

      // Submit defect
      const response = await defectApiService.submitDefect(submitData);

      if (response.success && response.data) {
        // Success - show confirmation and navigate back
        Alert.alert(
          'Success',
          `Your defect report has been submitted successfully!\n\nDefect ID: ${response.data.defectId}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back or to defect list
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              },
            },
          ]
        );

        // Clear form
        setTitle('');
        setDescription('');
        setStepsToReproduce('');
        setExpectedBehavior('');
        setActualBehavior('');
        setTouchedFields(new Set());
        setValidationErrors({});
      } else {
        // Error from API
        const errorMessage = response.error?.message || 'Failed to submit defect report';
        Alert.alert('Submission Failed', errorMessage);
      }
    } catch (error) {
      console.error('Error submitting defect:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Check if form is valid for submission
   */
  const isFormValid = () => {
    return (
      title.trim().length >= 5 &&
      description.trim().length >= 10 &&
      !validationErrors.title &&
      !validationErrors.description
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report a Defect</Text>
          <Text style={styles.headerSubtitle}>
            Help us improve by reporting bugs and issues you encounter
          </Text>
        </View>

        {/* Title Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              touchedFields.has('title') && validationErrors.title && styles.inputError,
            ]}
            placeholder="Brief summary of the issue"
            value={title}
            onChangeText={handleTitleChange}
            onBlur={() => handleBlur('title')}
            maxLength={200}
            editable={!isSubmitting}
          />
          {touchedFields.has('title') && validationErrors.title && (
            <Text style={styles.errorText}>{validationErrors.title}</Text>
          )}
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              touchedFields.has('description') && validationErrors.description && styles.inputError,
            ]}
            placeholder="Detailed description of the issue"
            value={description}
            onChangeText={handleDescriptionChange}
            onBlur={() => handleBlur('description')}
            multiline
            numberOfLines={4}
            maxLength={5000}
            editable={!isSubmitting}
          />
          {touchedFields.has('description') && validationErrors.description && (
            <Text style={styles.errorText}>{validationErrors.description}</Text>
          )}
          <Text style={styles.charCount}>{description.length}/5000</Text>
        </View>

        {/* Steps to Reproduce Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Steps to Reproduce (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
            value={stepsToReproduce}
            onChangeText={setStepsToReproduce}
            multiline
            numberOfLines={4}
            maxLength={5000}
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>{stepsToReproduce.length}/5000</Text>
        </View>

        {/* Expected Behavior Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Expected Behavior (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What should happen?"
            value={expectedBehavior}
            onChangeText={setExpectedBehavior}
            multiline
            numberOfLines={3}
            maxLength={2000}
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>{expectedBehavior.length}/2000</Text>
        </View>

        {/* Actual Behavior Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Actual Behavior (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What actually happens?"
            value={actualBehavior}
            onChangeText={setActualBehavior}
            multiline
            numberOfLines={3}
            maxLength={2000}
            editable={!isSubmitting}
          />
          <Text style={styles.charCount}>{actualBehavior.length}/2000</Text>
        </View>

        {/* Device Info Notice */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Device information will be automatically captured to help us diagnose the issue
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Defect Report</Text>
          )}
        </TouchableOpacity>

        {/* Required Fields Notice */}
        <Text style={styles.requiredNotice}>
          <Text style={styles.required}>*</Text> Required fields
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B35',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 12,
    marginTop: 5,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4A90E2',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  requiredNotice: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
