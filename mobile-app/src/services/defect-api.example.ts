/**
 * Example usage of Defect API Service
 * This file demonstrates how to use the defect tracking API client in the mobile app
 */

import { defectApiService, SubmitDefectRequest } from './defect-api.service';

/**
 * Example 1: Submit a new defect report
 */
export async function exampleSubmitDefect(userId: string) {
  const defectRequest: SubmitDefectRequest = {
    userId: userId,
    title: 'App crashes when viewing temple details',
    description: 'The app crashes immediately when I try to view details of Lepakshi Temple',
    stepsToReproduce: '1. Open the app\n2. Scan QR code LP-PILLAR-001\n3. Tap on "View Temple Details"\n4. App crashes',
    expectedBehavior: 'The temple details screen should open and display information',
    actualBehavior: 'The app crashes and returns to home screen',
    deviceInfo: {
      platform: 'android',
      osVersion: '13.0',
      appVersion: '1.0.0',
      deviceModel: 'Samsung Galaxy S21',
    },
  };

  const response = await defectApiService.submitDefect(defectRequest);

  if (response.success && response.data) {
    console.log('Defect submitted successfully!');
    console.log('Defect ID:', response.data.defectId);
    console.log('Status:', response.data.status); // Will be "New"
    console.log('Created at:', response.data.createdAt);
    
    // Show success message to user
    return response.data.defectId;
  } else {
    console.error('Failed to submit defect:', response.error?.message);
    
    // Show error message to user
    if (response.error?.details) {
      // Validation errors
      response.error.details.forEach((err: any) => {
        console.error(`${err.field}: ${err.message}`);
      });
    }
    
    return null;
  }
}

/**
 * Example 2: Get all defects for a user
 */
export async function exampleGetUserDefects(userId: string) {
  const response = await defectApiService.getUserDefects(userId);

  if (response.success && response.data) {
    console.log('Found', response.data.defects.length, 'defects');
    
    response.data.defects.forEach(defect => {
      console.log(`- ${defect.title} (${defect.status})`);
      console.log(`  ID: ${defect.defectId}`);
      console.log(`  Created: ${defect.createdAt}`);
      console.log(`  Updates: ${defect.updateCount}`);
    });
    
    // Check if there are more results
    if (response.data.lastEvaluatedKey) {
      console.log('More results available. Use pagination to fetch next page.');
    }
    
    return response.data.defects;
  } else {
    console.error('Failed to get defects:', response.error?.message);
    return [];
  }
}

/**
 * Example 3: Get defects with filters (e.g., only "In_Progress" defects)
 */
export async function exampleGetFilteredDefects(userId: string) {
  const response = await defectApiService.getUserDefects(userId, {
    status: 'In_Progress',
    limit: 10,
  });

  if (response.success && response.data) {
    console.log('In Progress defects:', response.data.defects.length);
    return response.data.defects;
  } else {
    console.error('Failed to get filtered defects:', response.error?.message);
    return [];
  }
}

/**
 * Example 4: Get detailed information about a specific defect
 */
export async function exampleGetDefectDetails(defectId: string) {
  const response = await defectApiService.getDefectDetails(defectId);

  if (response.success && response.data) {
    const defect = response.data;
    
    console.log('Defect Details:');
    console.log('Title:', defect.title);
    console.log('Description:', defect.description);
    console.log('Status:', defect.status);
    console.log('Created:', defect.createdAt);
    console.log('Last Updated:', defect.updatedAt);
    
    if (defect.stepsToReproduce) {
      console.log('Steps to Reproduce:', defect.stepsToReproduce);
    }
    
    console.log('\nStatus Updates:');
    defect.statusUpdates.forEach(update => {
      console.log(`- [${update.timestamp}] ${update.adminName}:`);
      console.log(`  ${update.message}`);
      
      if (update.previousStatus && update.newStatus) {
        console.log(`  Status changed: ${update.previousStatus} → ${update.newStatus}`);
      }
    });
    
    return defect;
  } else {
    console.error('Failed to get defect details:', response.error?.message);
    return null;
  }
}

/**
 * Example 5: Get notifications for a user
 */
export async function exampleGetNotifications(userId: string) {
  const response = await defectApiService.getNotifications(userId);

  if (response.success && response.data) {
    console.log('Notifications:', response.data.notifications.length);
    
    response.data.notifications.forEach(notification => {
      const readStatus = notification.isRead ? '✓' : '●';
      console.log(`${readStatus} ${notification.defectTitle}`);
      console.log(`  ${notification.message}`);
      console.log(`  Type: ${notification.type}`);
      console.log(`  Created: ${notification.createdAt}`);
    });
    
    return response.data.notifications;
  } else {
    console.error('Failed to get notifications:', response.error?.message);
    return [];
  }
}

/**
 * Example 6: Get only unread notifications
 */
export async function exampleGetUnreadNotifications(userId: string) {
  const response = await defectApiService.getNotifications(userId, true);

  if (response.success && response.data) {
    const unreadCount = response.data.notifications.length;
    console.log('Unread notifications:', unreadCount);
    
    return response.data.notifications;
  } else {
    console.error('Failed to get unread notifications:', response.error?.message);
    return [];
  }
}

/**
 * Example 7: Mark a notification as read
 */
export async function exampleMarkNotificationRead(notificationId: string) {
  const response = await defectApiService.markNotificationRead(notificationId);

  if (response.success && response.data) {
    console.log('Notification marked as read:', response.data.notificationId);
    return true;
  } else {
    console.error('Failed to mark notification as read:', response.error?.message);
    return false;
  }
}

/**
 * Example 8: Get unread notification count (for badge display)
 */
export async function exampleGetUnreadCount(userId: string) {
  const count = await defectApiService.getUnreadNotificationCount(userId);
  console.log('Unread notification count:', count);
  return count;
}

/**
 * Example 9: Set authentication token
 */
export function exampleSetAuthToken(token: string) {
  defectApiService.setAuthToken(token);
  console.log('Authentication token set');
}

/**
 * Example 10: Complete workflow - Submit defect and track it
 */
export async function exampleCompleteWorkflow(userId: string) {
  // 1. Submit a defect
  console.log('Step 1: Submitting defect...');
  const defectRequest: SubmitDefectRequest = {
    userId: userId,
    title: 'Audio guide not playing',
    description: 'The audio guide fails to play after scanning QR code',
    stepsToReproduce: '1. Scan QR code\n2. Tap play on audio guide\n3. Nothing happens',
    expectedBehavior: 'Audio should start playing',
    actualBehavior: 'No audio plays, no error message shown',
    deviceInfo: {
      platform: 'ios',
      osVersion: '16.0',
      appVersion: '1.0.0',
      deviceModel: 'iPhone 14',
    },
  };

  const submitResponse = await defectApiService.submitDefect(defectRequest);
  
  if (!submitResponse.success || !submitResponse.data) {
    console.error('Failed to submit defect');
    return;
  }

  const defectId = submitResponse.data.defectId;
  console.log('✓ Defect submitted:', defectId);

  // 2. Wait a bit (in real app, this would be triggered by user action)
  console.log('\nStep 2: Checking for updates...');
  
  // 3. Get defect details to see if there are any updates
  const detailsResponse = await defectApiService.getDefectDetails(defectId);
  
  if (detailsResponse.success && detailsResponse.data) {
    console.log('✓ Current status:', detailsResponse.data.status);
    console.log('✓ Updates:', detailsResponse.data.statusUpdates.length);
  }

  // 4. Check for notifications
  console.log('\nStep 3: Checking notifications...');
  const notificationsResponse = await defectApiService.getNotifications(userId, true);
  
  if (notificationsResponse.success && notificationsResponse.data) {
    const unreadCount = notificationsResponse.data.notifications.length;
    console.log('✓ Unread notifications:', unreadCount);
    
    // Mark first notification as read
    if (unreadCount > 0) {
      const firstNotification = notificationsResponse.data.notifications[0];
      await defectApiService.markNotificationRead(firstNotification.notificationId);
      console.log('✓ Marked notification as read');
    }
  }

  console.log('\n✓ Workflow complete!');
}

/**
 * Example 11: Error handling
 */
export async function exampleErrorHandling(userId: string) {
  // Example: Submit defect with invalid data
  const invalidRequest: SubmitDefectRequest = {
    userId: userId,
    title: 'Bug', // Too short (min 5 chars)
    description: 'Error', // Too short (min 10 chars)
  };

  const response = await defectApiService.submitDefect(invalidRequest);

  if (!response.success && response.error) {
    console.error('Error Code:', response.error.error);
    console.error('Error Message:', response.error.message);
    
    // Handle validation errors
    if (response.error.error === 'VALIDATION_ERROR' && response.error.details) {
      console.error('Validation Errors:');
      response.error.details.forEach((err: any) => {
        console.error(`- ${err.field}: ${err.message}`);
      });
    }
    
    // Handle network errors
    if (response.error.error === 'NETWORK_ERROR') {
      console.error('Network error occurred. Please check your connection.');
    }
  }
}

/**
 * Example 12: Pagination
 */
export async function examplePagination(userId: string) {
  let allDefects: any[] = [];
  let lastEvaluatedKey: string | undefined = undefined;

  do {
    const response = await defectApiService.getUserDefects(userId, {
      limit: 20,
      lastEvaluatedKey: lastEvaluatedKey,
    });

    if (response.success && response.data) {
      allDefects = allDefects.concat(response.data.defects);
      lastEvaluatedKey = response.data.lastEvaluatedKey;
      
      console.log(`Fetched ${response.data.defects.length} defects`);
    } else {
      console.error('Failed to fetch page:', response.error?.message);
      break;
    }
  } while (lastEvaluatedKey);

  console.log(`Total defects fetched: ${allDefects.length}`);
  return allDefects;
}
