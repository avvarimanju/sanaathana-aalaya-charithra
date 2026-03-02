import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  defectApiService,
  DefectDetails,
  DefectStatus,
  StatusUpdate,
} from '../services/defect-api.service';

/**
 * Status badge color mapping
 */
const STATUS_COLORS: Record<DefectStatus, { bg: string; text: string }> = {
  New: { bg: '#E3F2FD', text: '#1976D2' },
  Acknowledged: { bg: '#FFF9C4', text: '#F57F17' },
  In_Progress: { bg: '#FFE0B2', text: '#E65100' },
  Resolved: { bg: '#C8E6C9', text: '#2E7D32' },
  Closed: { bg: '#E0E0E0', text: '#616161' },
};

/**
 * Status display names
 */
const STATUS_LABELS: Record<DefectStatus, string> = {
  New: 'New',
  Acknowledged: 'Acknowledged',
  In_Progress: 'In Progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
};

interface DefectDetailsScreenProps {
  route: any;
  navigation: any;
}

export default function DefectDetailsScreen({ route, navigation }: DefectDetailsScreenProps) {
  const { defectId, userId } = route.params;

  // State
  const [defect, setDefect] = useState<DefectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load defect details from API
   */
  const loadDefectDetails = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await defectApiService.getDefectDetails(defectId);

      if (response.success && response.data) {
        setDefect(response.data);
      } else {
        const errorMessage = response.error?.message || 'Failed to load defect details';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      console.error('Error loading defect details:', err);
      const errorMessage = 'An unexpected error occurred while loading defect details';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [defectId]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadDefectDetails();
  }, [loadDefectDetails]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    loadDefectDetails(true);
  };

  /**
   * Render status badge
   */
  const renderStatusBadge = (status: DefectStatus) => {
    const colors = STATUS_COLORS[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.statusBadgeText, { color: colors.text }]}>
          {STATUS_LABELS[status]}
        </Text>
      </View>
    );
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format timestamp for timeline (relative or absolute)
   */
  const formatTimelineDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  /**
   * Render status update timeline item
   */
  const renderTimelineItem = (update: StatusUpdate, index: number, isLast: boolean) => {
    const isStatusChange = update.previousStatus && update.newStatus;

    return (
      <View key={update.updateId} style={styles.timelineItem}>
        {/* Timeline connector */}
        <View style={styles.timelineConnector}>
          <View style={[
            styles.timelineDot,
            isStatusChange && styles.timelineDotHighlight
          ]} />
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        {/* Timeline content */}
        <View style={styles.timelineContent}>
          {/* Status change indicator */}
          {isStatusChange && (
            <View style={styles.statusChangeContainer}>
              <Text style={styles.statusChangeLabel}>Status Changed</Text>
              <View style={styles.statusChangeFlow}>
                {renderStatusBadge(update.previousStatus!)}
                <Text style={styles.statusChangeArrow}>→</Text>
                {renderStatusBadge(update.newStatus!)}
              </View>
            </View>
          )}

          {/* Update message */}
          <Text style={styles.updateMessage}>{update.message}</Text>

          {/* Update metadata */}
          <View style={styles.updateMetadata}>
            <Text style={styles.updateAdmin}>👤 {update.adminName}</Text>
            <Text style={styles.updateTime}>🕒 {formatTimelineDate(update.timestamp)}</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render defect field section
   */
  const renderField = (label: string, value: string | undefined, icon: string = '📝') => {
    if (!value) return null;

    return (
      <View style={styles.fieldSection}>
        <Text style={styles.fieldLabel}>
          {icon} {label}
        </Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    );
  };

  /**
   * Render device info section
   */
  const renderDeviceInfo = () => {
    if (!defect?.deviceInfo) return null;

    const { platform, osVersion, appVersion, deviceModel } = defect.deviceInfo;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Device Information</Text>
        <View style={styles.deviceInfoGrid}>
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>Platform</Text>
            <Text style={styles.deviceInfoValue}>{platform.toUpperCase()}</Text>
          </View>
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>OS Version</Text>
            <Text style={styles.deviceInfoValue}>{osVersion}</Text>
          </View>
          <View style={styles.deviceInfoItem}>
            <Text style={styles.deviceInfoLabel}>App Version</Text>
            <Text style={styles.deviceInfoValue}>{appVersion}</Text>
          </View>
          {deviceModel && (
            <View style={styles.deviceInfoItem}>
              <Text style={styles.deviceInfoLabel}>Device Model</Text>
              <Text style={styles.deviceInfoValue}>{deviceModel}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render loading state
   */
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading defect details...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !defect) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadDefectDetails()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Render defect not found
   */
  if (!defect) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔍</Text>
        <Text style={styles.errorText}>Defect not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sort status updates chronologically (newest first)
  const sortedUpdates = [...defect.statusUpdates].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.defectId}>ID: {defect.defectId.substring(0, 8)}</Text>
            {renderStatusBadge(defect.status)}
          </View>
          <Text style={styles.defectTitle}>{defect.title}</Text>
          <Text style={styles.defectDate}>
            📅 Reported on {formatDate(defect.createdAt)}
          </Text>
          {defect.updatedAt !== defect.createdAt && (
            <Text style={styles.defectUpdated}>
              🔄 Last updated {formatTimelineDate(defect.updatedAt)}
            </Text>
          )}
        </View>

        {/* Defect Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Defect Details</Text>
          
          {renderField('Description', defect.description, '📝')}
          {renderField('Steps to Reproduce', defect.stepsToReproduce, '🔄')}
          {renderField('Expected Behavior', defect.expectedBehavior, '✅')}
          {renderField('Actual Behavior', defect.actualBehavior, '❌')}
        </View>

        {/* Device Info Section */}
        {renderDeviceInfo()}

        {/* Status Update Timeline Section */}
        {sortedUpdates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📊 Status Update Timeline ({sortedUpdates.length})
            </Text>
            <Text style={styles.timelineSubtitle}>
              Chronological updates from administrators
            </Text>
            <View style={styles.timeline}>
              {sortedUpdates.map((update, index) =>
                renderTimelineItem(update, index, index === sortedUpdates.length - 1)
              )}
            </View>
          </View>
        )}

        {/* No Updates Message */}
        {sortedUpdates.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Status Update Timeline</Text>
            <View style={styles.noUpdatesContainer}>
              <Text style={styles.noUpdatesIcon}>💬</Text>
              <Text style={styles.noUpdatesText}>No updates yet</Text>
              <Text style={styles.noUpdatesSubtext}>
                Administrators will post updates here as they work on your defect
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  defectId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  defectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 28,
  },
  defectDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  defectUpdated: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  deviceInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  deviceInfoItem: {
    width: '50%',
    marginBottom: 15,
  },
  deviceInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  deviceInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timelineSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    marginTop: -10,
  },
  timeline: {
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineConnector: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginTop: 5,
  },
  timelineDotHighlight: {
    backgroundColor: '#FF6B35',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
  },
  statusChangeContainer: {
    marginBottom: 12,
  },
  statusChangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
  },
  statusChangeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChangeArrow: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 8,
  },
  updateMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  updateMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateAdmin: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  updateTime: {
    fontSize: 11,
    color: '#999',
  },
  noUpdatesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noUpdatesIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  noUpdatesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  noUpdatesSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
