import React from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../utils/storage';
import { initOpenAI } from '../utils/openai';

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [userName, setUserName] = React.useState('User');
  const [apiKey, setApiKey] = React.useState('');
  const [hapticFeedback, setHapticFeedback] = React.useState(true);
  const [autoPlayTTS, setAutoPlayTTS] = React.useState(false);
  const [speechRate, setSpeechRate] = React.useState(1.0);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Settings',
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
      ),
      headerTransparent: false,
      headerStyle: {
        backgroundColor: theme.backgroundRoot,
      },
    });
  }, [navigation, theme]);

  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await StorageService.getPreferences();
    setUserName(prefs.userName || 'User');
    setApiKey(prefs.openAIKey || '');
    setHapticFeedback(prefs.hapticFeedback !== false);
    setAutoPlayTTS(prefs.autoPlayTTS || false);
    setSpeechRate(prefs.speechRate || 1.0);
    setIsDarkMode(prefs.theme === 'dark');
  };

  const savePreferences = async () => {
    const prefs = {
      userName,
      openAIKey: apiKey,
      hapticFeedback,
      autoPlayTTS,
      speechRate,
      theme: isDarkMode ? 'dark' : 'light',
    };
    
    await StorageService.savePreferences(prefs);
    
    if (apiKey) {
      initOpenAI(apiKey);
    }
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Alert.alert('Success', 'Settings saved successfully');
    navigation.goBack();
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your chat history and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.saveSession({ id: '', title: '', messages: [], createdAt: new Date(), updatedAt: new Date() });
            await StorageService.savePreferences({});
            Alert.alert('Success', 'All data cleared');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: Spacing.xl }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Profile</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.profileRow}>
              <Image
                source={require('../assets/images/user-avatar.png')}
                style={styles.avatar}
              />
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                style={[styles.nameInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
              />
            </View>
          </View>
        </View>

        {/* API Configuration */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>API Configuration</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.label}>OpenAI API Key</ThemedText>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[styles.apiKeyInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
            />
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              Your API key is stored locally and never shared
            </ThemedText>
          </View>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Voice Settings</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Auto-play TTS</ThemedText>
              <Switch
                value={autoPlayTTS}
                onValueChange={setAutoPlayTTS}
                trackColor={{ true: theme.primary, false: theme.border }}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Speech Rate</ThemedText>
              <View style={styles.speedControls}>
                <Pressable
                  onPress={() => setSpeechRate(Math.max(0.5, speechRate - 0.25))}
                  style={styles.speedButton}
                >
                  <Feather name="minus" size={20} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.speedText}>{speechRate.toFixed(2)}x</ThemedText>
                <Pressable
                  onPress={() => setSpeechRate(Math.min(2.0, speechRate + 0.25))}
                  style={styles.speedButton}
                >
                  <Feather name="plus" size={20} color={theme.text} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ true: theme.primary, false: theme.border }}
              />
            </View>
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Feedback</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.settingRow}>
              <ThemedText style={styles.settingLabel}>Haptic Feedback</ThemedText>
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ true: theme.primary, false: theme.border }}
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={savePreferences}
          >
            <ThemedText style={styles.saveButtonText}>Save Settings</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.clearButton, { borderColor: theme.error }]}
            onPress={handleClearData}
          >
            <ThemedText style={[styles.clearButtonText, { color: theme.error }]}>
              Clear All Data
            </ThemedText>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.aboutText}>AI Chat v1.0.0</ThemedText>
            <ThemedText style={[styles.aboutSubtext, { color: theme.textSecondary }]}>
              Powered by OpenAI GPT
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.small.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.lg,
  },
  nameInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  label: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  apiKeyInput: {
    fontSize: Typography.body.fontSize,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: Typography.small.fontSize - 1,
    marginTop: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  settingLabel: {
    fontSize: Typography.body.fontSize,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: Spacing.md,
  },
  speedControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedButton: {
    padding: Spacing.sm,
  },
  speedText: {
    marginHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    minWidth: 50,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
  },
  aboutSubtext: {
    fontSize: Typography.small.fontSize,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});