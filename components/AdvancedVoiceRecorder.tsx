import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface AdvancedVoiceRecorderProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string, segments?: string[]) => void;
  continuous?: boolean;
}

const WINDOW_WIDTH = Dimensions.get('window').width;
const WAVE_COUNT = 40;

export function AdvancedVoiceRecorder({
  visible,
  onClose,
  onRecordingComplete,
  continuous = false,
}: AdvancedVoiceRecorderProps) {
  const theme = useTheme();
  
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [soundLevel, setSoundLevel] = React.useState(0);
  const [voiceActivityDetected, setVoiceActivityDetected] = React.useState(false);
  const [segments, setSegments] = React.useState<string[]>([]);
  
  const waveAnimations = React.useRef(
    Array(WAVE_COUNT).fill(0).map(() => new Animated.Value(0.3))
  ).current;
  
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;
  const silenceTimer = React.useRef<NodeJS.Timeout | null>(null);
  const recordingTimer = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (visible) {
      setupAudio();
      if (continuous) {
        startContinuousRecording();
      }
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [visible, continuous]);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const cleanup = () => {
    stopRecording();
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const startContinuousRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.WAVE,
            audioEncoder: Audio.AndroidAudioEncoder.MPEG_4,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        },
        async (status) => {
          if (status.isRecording && status.metering !== undefined) {
            const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
            setSoundLevel(normalizedLevel);
            animateWaves(normalizedLevel);
            
            // Voice Activity Detection (VAD)
            const isVoiceActive = normalizedLevel > 0.15;
            setVoiceActivityDetected(isVoiceActive);
            
            if (continuous) {
              handleVoiceActivityDetection(isVoiceActive);
            }
          }
          
          if (status.durationMillis) {
            setDuration(Math.floor(status.durationMillis / 1000));
          }
        },
        100 // Update interval in ms
      );
      
      setRecording(recording);
      setIsRecording(true);
      
      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Start pulse animation
      startPulseAnimation();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleVoiceActivityDetection = (isActive: boolean) => {
    if (isActive) {
      // Voice detected - clear silence timer
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    } else {
      // Silence detected - start timer for automatic segmentation
      if (!silenceTimer.current) {
        silenceTimer.current = setTimeout(() => {
          // Save current segment and start new one
          segmentRecording();
        }, 2000); // 2 seconds of silence triggers segmentation
      }
    }
  };

  const segmentRecording = async () => {
    if (!recording) return;
    
    try {
      // Stop current recording and get URI
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        setSegments(prev => [...prev, uri]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Start new recording segment
      if (continuous) {
        startContinuousRecording();
      }
    } catch (error) {
      console.error('Error segmenting recording:', error);
    }
  };

  const startRecording = async () => {
    if (continuous) {
      startContinuousRecording();
    } else {
      try {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
          (status) => {
            if (status.isRecording && status.metering !== undefined) {
              const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
              setSoundLevel(normalizedLevel);
              animateWaves(normalizedLevel);
            }
            
            if (status.durationMillis) {
              setDuration(Math.floor(status.durationMillis / 1000));
            }
          },
          100
        );
        
        setRecording(recording);
        setIsRecording(true);
        startPulseAnimation();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        if (segments.length > 0) {
          // Multiple segments - return all
          onRecordingComplete(uri, [...segments, uri]);
        } else {
          // Single recording
          onRecordingComplete(uri);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setRecording(null);
      setDuration(0);
      setSegments([]);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    
    try {
      if (isPaused) {
        await recording.startAsync();
        setIsPaused(false);
      } else {
        await recording.pauseAsync();
        setIsPaused(true);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const animateWaves = (level: number) => {
    waveAnimations.forEach((anim, index) => {
      const delay = index * 20;
      const height = 0.3 + level * 0.7 * (1 - index / WAVE_COUNT * 0.3);
      
      Animated.timing(anim, {
        toValue: height,
        duration: 100,
        delay,
        useNativeDriver: false,
      }).start();
    });
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        stopRecording();
        onClose();
      }}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.title}>
            {continuous ? 'Continuous Recording' : 'Voice Recording'}
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Voice Activity Indicator */}
          {continuous && (
            <View style={styles.vadContainer}>
              <View
                style={[
                  styles.vadIndicator,
                  { backgroundColor: voiceActivityDetected ? '#4CAF50' : theme.textSecondary }
                ]}
              />
              <ThemedText style={styles.vadText}>
                {voiceActivityDetected ? 'Voice Detected' : 'Listening...'}
              </ThemedText>
            </View>
          )}

          {/* Duration Display */}
          <ThemedText style={styles.duration}>{formatDuration(duration)}</ThemedText>

          {/* Sound Level Indicator */}
          <View style={styles.soundLevelContainer}>
            <ThemedText style={styles.soundLevelText}>
              Level: {Math.round(soundLevel * 100)}%
            </ThemedText>
          </View>

          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            {waveAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.wave,
                  {
                    backgroundColor: isRecording ? theme.primary : theme.textSecondary,
                    transform: [{ scaleY: anim }],
                  },
                ]}
              />
            ))}
          </View>

          {/* Segments Indicator */}
          {segments.length > 0 && (
            <View style={styles.segmentsContainer}>
              <ThemedText style={styles.segmentsText}>
                Segments: {segments.length}
              </ThemedText>
            </View>
          )}

          {/* Recording Controls */}
          <View style={styles.controls}>
            {!isRecording ? (
              <Pressable onPress={startRecording} style={styles.recordButton}>
                <Animated.View
                  style={[
                    styles.recordButtonInner,
                    { backgroundColor: theme.error },
                  ]}
                >
                  <Feather name="mic" size={32} color="#FFFFFF" />
                </Animated.View>
                <ThemedText style={styles.recordButtonText}>
                  Tap to Start
                </ThemedText>
              </Pressable>
            ) : (
              <>
                <Pressable onPress={pauseRecording} style={styles.controlButton}>
                  <View style={[styles.controlButtonInner, { backgroundColor: theme.warning }]}>
                    <Feather name={isPaused ? 'play' : 'pause'} size={24} color="#FFFFFF" />
                  </View>
                  <ThemedText style={styles.controlButtonText}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </ThemedText>
                </Pressable>

                <Pressable onPress={stopRecording} style={styles.recordButton}>
                  <Animated.View
                    style={[
                      styles.recordButtonInner,
                      {
                        backgroundColor: theme.error,
                        transform: [{ scale: pulseAnimation }],
                      },
                    ]}
                  >
                    <View style={styles.stopIcon} />
                  </Animated.View>
                  <ThemedText style={styles.recordButtonText}>
                    Tap to Stop
                  </ThemedText>
                </Pressable>

                <View style={styles.controlButton}>
                  <View style={{ width: 56, height: 56 }} />
                </View>
              </>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <ThemedText style={styles.instructionText}>
              {continuous
                ? 'Recording continuously. Speak naturally - pauses will create segments.'
                : isRecording
                ? 'Recording... Tap stop when finished'
                : 'Tap the microphone to start recording'}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  vadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  vadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  vadText: {
    fontSize: Typography.body.fontSize,
    opacity: 0.7,
  },
  duration: {
    fontSize: 48,
    fontWeight: '200',
    marginBottom: Spacing.md,
  },
  soundLevelContainer: {
    marginBottom: Spacing.xl,
  },
  soundLevelText: {
    fontSize: Typography.small.fontSize,
    opacity: 0.6,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    marginBottom: Spacing['2xl'],
    gap: 2,
  },
  wave: {
    width: 3,
    height: 60,
    borderRadius: 2,
  },
  segmentsContainer: {
    marginBottom: Spacing.xl,
  },
  segmentsText: {
    fontSize: Typography.body.fontSize,
    opacity: 0.6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  recordButton: {
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  recordButtonText: {
    fontSize: Typography.small.fontSize,
    opacity: 0.6,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  controlButtonText: {
    fontSize: Typography.small.fontSize,
    opacity: 0.6,
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  instructions: {
    position: 'absolute',
    bottom: Spacing['3xl'],
    left: Spacing['2xl'],
    right: Spacing['2xl'],
  },
  instructionText: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    opacity: 0.6,
  },
});