import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Message } from '../utils/storage';

interface MessageBubbleProps {
  message: Message;
  onDelete?: (id: string) => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, onDelete, onRegenerate }: MessageBubbleProps) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMenu(true);
    setTimeout(() => setShowMenu(false), 3000);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMenu(false);
  };

  const handleSpeak = () => {
    Speech.speak(message.content, {
      rate: 1.0,
      pitch: 1.0,
    });
    setShowMenu(false);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.(message.id);
    setShowMenu(false);
  };

  const handleRegenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRegenerate?.();
    setShowMenu(false);
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <Pressable
        onLongPress={handleLongPress}
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.userBubble : theme.aiBubble,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          }
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser ? theme.userBubbleText : theme.aiBubbleText,
            }
          ]}
        >
          {message.content}
        </Text>
        <Text style={[styles.timestamp, { color: isUser ? theme.userBubbleText : theme.textSecondary }]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Pressable>

      {showMenu && (
        <View style={[styles.menu, { backgroundColor: theme.backgroundSecondary }]}>
          <Pressable style={styles.menuItem} onPress={handleCopy}>
            <Feather name="copy" size={16} color={theme.text} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleSpeak}>
            <Feather name="volume-2" size={16} color={theme.text} />
          </Pressable>
          {!isUser && onRegenerate && (
            <Pressable style={styles.menuItem} onPress={handleRegenerate}>
              <Feather name="refresh-cw" size={16} color={theme.text} />
            </Pressable>
          )}
          <Pressable style={styles.menuItem} onPress={handleDelete}>
            <Feather name="trash-2" size={16} color={theme.error} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  text: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.fontSize * 1.4,
  },
  timestamp: {
    fontSize: Typography.small.fontSize - 2,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  menu: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
});