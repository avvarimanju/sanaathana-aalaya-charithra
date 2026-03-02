import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  defectApiService,
  DefectSummary,
  DefectStatus,
} from '../services/defect-api.service';

/**
 * Status badge color mapping
 */
const STATUS_COLORS: Record<DefectStatus, { bg: string; text: string }> = {
  New: { bg: '#E3F2FD', text: '#1976D2' }, // Blue
  Acknowledged: { bg: '#FFF9C4', text: '#F57F17' }, // Yellow
  In_Progress: { bg: '#FFE0B2', text: '#E65100' }, // Orange
  Resolved: { bg: '#C8E6C9', text: '#2E7D32' }, // Green
  Closed: { bg: '#E0E0E0', text: '#616161' }, // Gray
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

interface MyDefectsScreenProps {
  route: any;
  navigation: any;
}

export default function MyDefectsScreen({ route, navigation }: MyDefectsScreenProps) {
  const { userId } = route.params || { userId: 'demo-user-123' };

  // State
  const [defects, setDefects] = useState<DefectSummary[]>([]);
  const [filteredDefects, setFilteredDefects] = useState<DefectSummary[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<DefectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load defects from API
   */
  const loadDefects = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await defectApiService.getUserDefects(userId, {
        status: selectedStatus || undefined,
        limit: 50,
      });

      if (response.success && response.data) {
        setDefects(response.data.defects);
        setFilteredDefects(response.data.defects);
      } else {
        const errorMessage = response.error?.message || 'Failed to load defects';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      console.error('Error loading defects:', err);
      const errorMessage = 'An unexpected error occurred while loading defects';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, selectedStatus]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadDefects();
  }, [loadDefects]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    loadDefects(true);
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilter = (status: DefectStatus | null) => {
    setSelectedStatus(status);
  };

  /**
   * Filter defects by selected status
   */
  useEffect(() => {
    if (selectedStatus) {
      setFilteredDefects(defects.filter(d => d.status === selectedStatus));
    } else {
      setFilteredDefects(defects);
    }
  }, [selectedStatus, defects]);

  /**
   * Navigate to defect details
   */
  const handleDefectPress = (defectId: string) => {
    navigation.navigate('DefectDetails', { defectId, userId });
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
   * Render defect item
   */
  const renderDefectItem = ({ item }: { item: DefectSummary }) => {
    const createdDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.defectCard}
        onPress={() => handleDefectPress(item.defectId)}
        activeOpacity={0.7}
      >
        <View style={styles.defectHeader}>
          <Text style={styles.defectTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {renderStatusBadge(item.status)}
        </View>

        <Text style={styles.defectDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.defectFooter}>
          <Text style={styles.defectDate}>📅 {createdDate}</Text>
          {item.updateCount > 0 && (
            <Text style={styles.defectUpdates}>
              💬 {item.updateCount} update{item.updateCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (isLoading) {
      return null;
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📋</Text>
        <Text style={styles.emptyStateText}>
          {selectedStatus
            ? `No ${STATUS_LABELS[selectedStatus].toLowerCase()} defects`
            : 'No defects reported yet'}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {selectedStatus
            ? 'Try selecting a different status filter'
            : 'Report a defect to get started'}
        </Text>
        {!selectedStatus && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate('DefectReport', { userId })}
          >
            <Text style={styles.reportButtonText}>Report a Defect</Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.loadingText}>Loading your defects...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !isRefreshing && defects.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadDefects()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 My Defects</Text>
        <Text style={styles.headerSubtitle}>
          Track your reported issues ({filteredDefects.length})
        </Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Status:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...Object.keys(STATUS_COLORS) as DefectStatus[]]}
          keyExtractor={(item) => item || 'all'}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item;
            const label = item ? STATUS_LABELS[item] : 'All';
            const colors = item ? STATUS_COLORS[item] : { bg: '#FF6B35', text: '#fff' };

            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: colors.bg, borderColor: colors.bg },
                ]}
                onPress={() => handleStatusFilter(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && { color: colors.text, fontWeight: 'bold' },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Defects List */}
      <FlatList
        data={filteredDefects}
        renderItem={renderDefectItem}
        keyExtractor={(item) => item.defectId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      />

      {/* Floating Action Button */}
      {filteredDefects.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('DefectReport', { userId })}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
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
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterList: {
    paddingHorizontal: 15,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
  },
  listContent: {
    padding: 15,
    paddingBottom: 80,
  },
  defectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  defectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  defectTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  defectDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  defectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defectDate: {
    fontSize: 12,
    color: '#999',
  },
  defectUpdates: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  reportButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
