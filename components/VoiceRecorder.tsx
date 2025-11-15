import React from 'react';
import { View, Modal, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface VoiceRecorderProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string) => void;
}

export function VoiceRecorder({ visible, onClose, onRecordingComplete }: VoiceRecorderProps) {
  const theme = useTheme();
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [duration, setDuration] = React.useState(0);
  const waveAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      startRecording();
    } else if (recording) {
      stopRecording();
    }
  }, [visible]);

  React.useEffect(() => {
    if (recording) {
      const interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      // Animate waveform
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => clearInterval(interval);
    }
  }, [recording]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
      onClose();
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setDuration(0);

      if (uri) {
        onRecordingComplete(uri);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setDuration(0);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={80} style={styles.container}>
        <View style={[styles.content, { backgroundColor: theme.backgroundSecondary }]}>
          <Animated.View style={[styles.waveform, { transform: [{ scale: waveAnim }] }]}>
            <View style={[styles.waveDot, { backgroundColor: theme.error }]} />
          </Animated.View>

          <Text style={[styles.duration, { color: theme.text }]}>
            {formatDuration(duration)}
          </Text>

          <Text style={[styles.instruction, { color: theme.textSecondary }]}>
            Release to send
          </Text>

          <Pressable style={styles.cancelButton} onPress={cancelRecording}>
            <Text style={[styles.cancelText, { color: theme.error }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing['4xl'],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 200,
  },
  waveform: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  waveDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.8,
  },
  duration: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  instruction: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.xl,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  cancelText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
  },
});