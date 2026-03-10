import * as Linking from 'expo-linking';

export interface DeepLinkParams {
  type: 'temple' | 'artifact' | 'unknown';
  id?: string;
  path?: string;
}

/**
 * Parse a deep link URL and extract the type and ID
 * Supports URLs like:
 * - https://charithra.org/temple/tirupati-balaji
 * - https://charithra.org/artifact/ancient-sculpture-123
 */
export function parseDeepLink(url: string): DeepLinkParams {
  try {
    const { path, queryParams } = Linking.parse(url);
    
    if (!path) {
      return { type: 'unknown', path: url };
    }

    // Handle temple links: /temple/:id
    if (path.startsWith('temple/')) {
      const id = path.replace('temple/', '');
      return { type: 'temple', id, path };
    }

    // Handle artifact links: /artifact/:id
    if (path.startsWith('artifact/')) {
      const id = path.replace('artifact/', '');
      return { type: 'artifact', id, path };
    }

    return { type: 'unknown', path };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return { type: 'unknown', path: url };
  }
}

/**
 * Get the initial URL if the app was opened from a deep link
 */
export async function getInitialDeepLink(): Promise<string | null> {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
}

/**
 * Subscribe to deep link events while the app is running
 */
export function subscribeToDeepLinks(
  callback: (url: string) => void
): { remove: () => void } {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });

  return subscription;
}
