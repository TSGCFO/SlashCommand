import React from 'react';
import {
  View,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { v4 as uuidv4 } from 'uuid';

import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { MessageBubble } from '../components/MessageBubble';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { SummaryModal } from '../components/SummaryModal';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useScreenInsets } from '../hooks/useScreenInsets';
import { StorageService, Message, Session } from '../utils/storage';
import { getOpenAI, initOpenAI } from '../utils/openai';
import { ExportService } from '../utils/export';

export default function ChatScreen({ route }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenInsets = useScreenInsets();
  const navigation = useNavigation();
  
  const [session, setSession] = React.useState<Session | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [apiKeyError, setApiKeyError] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState('');
  const [showSummary, setShowSummary] = React.useState(false);
  
  const flatListRef = React.useRef<FlatList>(null);

  // Initialize session
  React.useEffect(() => {
    loadOrCreateSession();
    checkApiKey();
  }, [route?.params?.sessionId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: session?.title || 'New Chat',
      headerTransparent: true,
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.headerButton}
        >
          <Ionicons name="menu" size={24} color={theme.text} />
        </Pressable>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable onPress={() => setShowVoiceRecorder(true)} style={styles.headerButton}>
            <Ionicons name="mic-outline" size={22} color={theme.text} />
          </Pressable>
          <Pressable onPress={showMenu} style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, session, theme]);

  const checkApiKey = async () => {
    const prefs = await StorageService.getPreferences();
    if (!prefs.openAIKey) {
      setApiKeyError(true);
    } else {
      initOpenAI(prefs.openAIKey);
      setApiKeyError(false);
    }
  };

  const loadOrCreateSession = async () => {
    const sessionId = route?.params?.sessionId;
    
    if (sessionId) {
      const sessions = await StorageService.getSessions();
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession) {
        setSession(existingSession);
        setMessages(existingSession.messages);
        return;
      }
    }

    // Create new session
    const newSession: Session = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSession(newSession);
    setMessages([]);
    await StorageService.setCurrentSessionId(newSession.id);
  };

  const showMenu = () => {
    Alert.alert(
      'Options',
      '',
      [
        {
          text: 'View Insights',
          onPress: () => setShowSummary(true),
        },
        {
          text: 'Export Chat',
          onPress: showExportOptions,
        },
        {
          text: 'Share Summary',
          onPress: shareSummary,
        },
        {
          text: 'Clear Chat',
          onPress: clearChat,
          style: 'destructive',
        },
        {
          text: 'Rename Session',
          onPress: renameSession,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const showExportOptions = () => {
    Alert.alert(
      'Export Conversation',
      'Choose export format',
      [
        {
          text: 'Text File',
          onPress: async () => {
            if (session) {
              await ExportService.exportAsText(session);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: 'Markdown',
          onPress: async () => {
            if (session) {
              await ExportService.exportAsMarkdown(session);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: 'JSON',
          onPress: async () => {
            if (session) {
              await ExportService.exportAsJSON(session);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const shareSummary = async () => {
    if (session) {
      const summary = ExportService.generateShareableSummary(session);
      await ExportService.shareText(summary, 'Share Conversation Summary');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (session) {
      const updatedSession = { ...session, messages: [] };
      setSession(updatedSession);
      await StorageService.saveSession(updatedSession);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renameSession = () => {
    Alert.prompt(
      'Rename Session',
      'Enter a new name for this session',
      async (newTitle) => {
        if (newTitle && session) {
          const updatedSession = { ...session, title: newTitle };
          setSession(updatedSession);
          await StorageService.saveSession(updatedSession);
        }
      },
      'plain-text',
      session?.title
    );
  };

  const sendMessage = async (content: string, isVoice: boolean = false) => {
    if (!content.trim() || apiKeyError) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const openAI = getOpenAI();
      
      // Generate title for first message
      if (messages.length === 0 && session) {
        const title = await openAI.generateTitle([{ role: 'user', content: content.trim() }]);
        const updatedSession = { ...session, title };
        setSession(updatedSession);
        navigation.setOptions({ headerTitle: title });
      }

      // Stream AI response
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      let fullContent = '';
      setStreamingMessage('');
      
      const messagesForAPI = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      for await (const chunk of openAI.streamChatCompletion(messagesForAPI, (chunk) => {
        fullContent += chunk;
        setStreamingMessage(fullContent);
      })) {
        // Streaming handled in callback
      }

      aiMessage.content = fullContent;
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      setStreamingMessage('');

      // Save session
      if (session) {
        const updatedSession = {
          ...session,
          messages: finalMessages,
          updatedAt: new Date(),
        };
        await StorageService.saveSession(updatedSession);
      }

      // Auto-play TTS if enabled
      const prefs = await StorageService.getPreferences();
      if (prefs.autoPlayTTS) {
        Speech.speak(fullContent, {
          rate: prefs.speechRate || 1.0,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please check your API key in settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async (uri: string) => {
    setShowVoiceRecorder(false);
    setIsLoading(true);

    try {
      const openAI = getOpenAI();
      const transcription = await openAI.transcribeAudio(uri);
      if (transcription) {
        await sendMessage(transcription, true);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    const filtered = messages.filter(m => m.id !== messageId);
    setMessages(filtered);
    
    if (session) {
      const updatedSession = {
        ...session,
        messages: filtered,
        updatedAt: new Date(),
      };
      await StorageService.saveSession(updatedSession);
    }
  };

  const regenerateLastMessage = async () => {
    const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return;

    const messagesUpToLastUser = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(messagesUpToLastUser);
    
    const lastUserMessage = messages[lastUserMessageIndex];
    await sendMessage(lastUserMessage.content);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadOrCreateSession();
    setRefreshing(false);
  }, []);

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      onDelete={deleteMessage}
      onRegenerate={item.role === 'assistant' ? regenerateLastMessage : undefined}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/images/empty-chat.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText style={styles.emptyText}>Start a conversation</ThemedText>
    </View>
  );

  const renderStreamingMessage = () => {
    if (!streamingMessage) return null;

    const tempMessage: Message = {
      id: 'streaming',
      role: 'assistant',
      content: streamingMessage,
      timestamp: new Date(),
    };

    return <MessageBubble message={tempMessage} />;
  };

  if (apiKeyError) {
    return (
      <ThemedView style={[styles.container, { paddingTop: screenInsets.paddingTop }]}>
        <View style={styles.apiKeyError}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={styles.apiKeyErrorText}>
            Please set your OpenAI API key in Settings to start chatting
          </ThemedText>
          <Pressable
            style={[styles.settingsButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <ThemedText style={{ color: '#FFFFFF' }}>Go to Settings</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={[styles.container, { paddingTop: screenInsets.paddingTop }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderStreamingMessage}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.textInput, { color: theme.text }]}
              multiline
              maxHeight={120}
              editable={!isLoading}
            />
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.primary} style={styles.sendButton} />
            ) : (
              <>
                <Pressable
                  onPressIn={() => setShowVoiceRecorder(true)}
                  style={styles.voiceButton}
                >
                  <Ionicons name="mic-outline" size={20} color={theme.primary} />
                </Pressable>
                <Pressable
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim()}
                  style={styles.sendButton}
                >
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={inputText.trim() ? theme.primary : theme.textSecondary} 
                  />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ThemedView>

      <VoiceRecorder
        visible={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={handleVoiceRecording}
      />
      
      <SummaryModal
        visible={showSummary}
        session={session}
        onClose={() => setShowSummary(false)}
      />
      
      <OfflineIndicator />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyImage: {
    width: 150,
    height: 150,
    opacity: 0.3,
    marginBottom: Spacing.xl,
  },
  emptyText: {
    opacity: 0.5,
    fontSize: Typography.body.fontSize,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    paddingVertical: Spacing.sm,
    maxHeight: 120,
  },
  voiceButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sendButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  apiKeyError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['4xl'],
  },
  apiKeyErrorText: {
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  settingsButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});