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
  Notification,
  NotificationType,
} from '../services/defect-api.service';
import { formatRelativeTime } from '../utils/dateFormatter';

/**
 * Notification type icons and colors
 */
const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  STATUS_CHANGE: { icon: '🔄', color: '#FF6B35' },
  COMMENT_ADDED: { icon: '💬', color: '#4CAF50' },
};

interface NotificationsScreenProps {
  route: any;
  navigation: any;
}

export default function NotificationsScreen({ route, navigation }: NotificationsScreenProps) {
  const { userId } = route.params || { userId: 'demo-user-123' };

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await defectApiService.getNotifications(userId, false);

      if (response.success && response.data) {
        setNotifications(response.data.notifications);
      } else {
        const errorMessage = response.error?.message || 'Failed to load notifications';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      const errorMessage = 'An unexpected error occurred while loading notifications';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    loadNotifications(true);
  };

  /**
   * Mark notification as read and navigate to defect details
   */
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        const response = await defectApiService.markNotificationRead(notification.notificationId);
        
        if (response.success) {
          // Update local state
          setNotifications((prevNotifications: Notification[]) =>
            prevNotifications.map((n: Notification) =>
              n.notificationId === notification.notificationId
                ? { ...n, isRead: true }
                : n
            )
          );
        }
      } catch (err) {
        console.error('Error marking notification as read:', err);
        // Continue navigation even if marking as read fails
      }
    }

    // Navigate to defect details
    navigation.navigate('DefectDetails', {
      defectId: notification.defectId,
      userId,
    });
  };

  // Date formatting function removed - now using imported formatRelativeTime from ../utils/dateFormatter

  /**
   * Render notification item
   */
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const config = NOTIFICATION_CONFIG[item.type];
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          isUnread && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Unread indicator */}
        {isUnread && <View style={styles.unreadIndicator} />}

        {/* Notification icon */}
        <View style={[styles.notificationIcon, { backgroundColor: config.color + '20' }]}>
          <Text style={styles.notificationIconText}>{config.icon}</Text>
        </View>

        {/* Notification content */}
        <View style={styles.notificationContent}>
          {/* Defect title */}
          <Text
            style={[
              styles.notificationTitle,
              isUnread && styles.notificationTitleUnread,
            ]}
            numberOfLines={1}
          >
            {item.defectTitle}
          </Text>

          {/* Notification message */}
          <Text
            style={[
              styles.notificationMessage,
              isUnread && styles.notificationMessageUnread,
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          {/* Timestamp */}
          <Text style={styles.notificationTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>

        {/* Chevron */}
        <View style={styles.notificationChevron}>
          <Text style={styles.chevronIcon}>›</Text>
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
        <Text style={styles.emptyStateIcon}>🔔</Text>
        <Text style={styles.emptyStateText}>No notifications yet</Text>
        <Text style={styles.emptyStateSubtext}>
          You'll be notified when administrators update your defects
        </Text>
      </View>
    );
  };

  /**
   * Calculate unread count
   */
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  /**
   * Render loading state
   */
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && !isRefreshing && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
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
        <Text style={styles.headerTitle}>🔔 Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'All caught up!'}
        </Text>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item: Notification) => item.notificationId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      />
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
  listContent: {
    padding: 15,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  notificationCardUnread: {
    backgroundColor: '#FFF9F5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notificationTitleUnread: {
    color: '#333',
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationMessageUnread: {
    color: '#333',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationChevron: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronIcon: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
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
});
