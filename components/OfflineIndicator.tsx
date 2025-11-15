import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from './ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { OfflineQueueService, SyncStatus } from '../utils/offlineQueue';

export function OfflineIndicator() {
  const theme = useTheme();
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Initialize offline queue
    OfflineQueueService.initialize();

    // Subscribe to sync status updates
    const unsubscribe = OfflineQueueService.subscribeToSyncStatus((status) => {
      setSyncStatus(status);
      
      // Animate indicator when status changes
      if (!status.isOnline || status.pendingCount > 0) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        if (status.isSyncing) {
          startPulseAnimation();
        } else {
          stopPulseAnimation();
        }
      } else {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    // Get initial status
    OfflineQueueService.getSyncStatus().then(setSyncStatus);

    return unsubscribe;
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handlePress = async () => {
    if (syncStatus?.failedCount && syncStatus.failedCount > 0) {
      // Retry failed messages
      await OfflineQueueService.retryFailed();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (!syncStatus?.isOnline) {
      // Show offline info
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  if (!syncStatus || (syncStatus.isOnline && syncStatus.pendingCount === 0)) {
    return null;
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline Mode';
    }
    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }
    if (syncStatus.pendingCount > 0) {
      return `${syncStatus.pendingCount} pending`;
    }
    if (syncStatus.failedCount > 0) {
      return `${syncStatus.failedCount} failed`;
    }
    return '';
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return 'wifi-off';
    }
    if (syncStatus.isSyncing) {
      return 'refresh-cw';
    }
    if (syncStatus.failedCount > 0) {
      return 'alert-circle';
    }
    return 'clock';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) {
      return theme.textSecondary;
    }
    if (syncStatus.failedCount > 0) {
      return theme.error;
    }
    if (syncStatus.isSyncing) {
      return theme.primary;
    }
    return theme.warning;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.surfaceSecondary,
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable onPress={handlePress} style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: syncStatus.isSyncing ? pulseAnim : 1 }],
            },
          ]}
        >
          <Feather
            name={getStatusIcon()}
            size={16}
            color={getStatusColor()}
          />
        </Animated.View>
        
        <ThemedText style={[styles.text, { color: getStatusColor() }]}>
          {getStatusText()}
        </ThemedText>
        
        {syncStatus.failedCount > 0 && (
          <View style={styles.retryHint}>
            <ThemedText style={styles.retryText}>Tap to retry</ThemedText>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: Typography.small.fontSize,
    fontWeight: '500',
  },
  retryHint: {
    marginLeft: Spacing.xs,
  },
  retryText: {
    fontSize: Typography.small.fontSize - 1,
    opacity: 0.7,
  },
});