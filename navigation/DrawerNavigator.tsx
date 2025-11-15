import React from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Image, Text, Alert } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { StorageService, Session } from '../utils/storage';
import { VectorDatabase } from '../utils/vectordb';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

type DrawerParamList = {
  Chat: { sessionId?: string };
  Settings: undefined;
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = React.useState('');
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [userName, setUserName] = React.useState('User');
  const [filteredSessions, setFilteredSessions] = React.useState<Session[]>([]);

  React.useEffect(() => {
    loadSessions();
    loadUserName();
  }, []);

  React.useEffect(() => {
    if (searchText && searchText.length > 2) {
      // Perform semantic search for longer queries
      performSemanticSearch();
    } else if (searchText) {
      // Simple text filter for short queries
      const filtered = sessions.filter(s => 
        s.title.toLowerCase().includes(searchText.toLowerCase()) ||
        s.messages.some(m => m.content.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredSessions(filtered);
    } else {
      setFilteredSessions(sessions);
    }
  }, [searchText, sessions]);

  const performSemanticSearch = async () => {
    try {
      const results = await VectorDatabase.search(searchText, 10);
      if (results.length > 0) {
        // Filter sessions based on semantic search results
        const matchedSessionIds = new Set(results.map(r => r.sessionId));
        const filtered = sessions.filter(s => matchedSessionIds.has(s.id));
        setFilteredSessions(filtered);
      } else {
        // Fall back to simple search
        const filtered = sessions.filter(s => 
          s.title.toLowerCase().includes(searchText.toLowerCase()) ||
          s.messages.some(m => m.content.toLowerCase().includes(searchText.toLowerCase()))
        );
        setFilteredSessions(filtered);
      }
    } catch (error) {
      console.error('Semantic search error:', error);
      // Fall back to simple search
      const filtered = sessions.filter(s => 
        s.title.toLowerCase().includes(searchText.toLowerCase()) ||
        s.messages.some(m => m.content.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredSessions(filtered);
    }
  };

  const loadSessions = async () => {
    const loadedSessions = await StorageService.getSessions();
    setSessions(loadedSessions);
    
    // Initialize vector database and index all sessions
    await VectorDatabase.initialize();
    for (const session of loadedSessions) {
      await VectorDatabase.indexSession(session);
    }
  };

  const loadUserName = async () => {
    const prefs = await StorageService.getPreferences();
    setUserName(prefs.userName || 'User');
  };

  const createNewSession = async () => {
    const newSessionId = uuidv4();
    props.navigation.navigate('Chat', { sessionId: newSessionId });
    props.navigation.closeDrawer();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectSession = (sessionId: string) => {
    props.navigation.navigate('Chat', { sessionId });
    props.navigation.closeDrawer();
  };

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteSession(sessionId);
            loadSessions();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const navigateToSettings = () => {
    props.navigation.navigate('Settings' as never);
    props.navigation.closeDrawer();
  };

  const renderSession = (session: Session) => (
    <Pressable
      key={session.id}
      style={[styles.sessionItem, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => selectSession(session.id)}
      onLongPress={() => deleteSession(session.id)}
    >
      <View style={styles.sessionContent}>
        <ThemedText style={styles.sessionTitle} numberOfLines={1}>
          {session.title}
        </ThemedText>
        {session.messages.length > 0 && (
          <ThemedText style={[styles.sessionPreview, { color: theme.textSecondary }]} numberOfLines={1}>
            {session.messages[session.messages.length - 1].content}
          </ThemedText>
        )}
        <ThemedText style={[styles.sessionTime, { color: theme.textSecondary }]}>
          {new Date(session.updatedAt).toLocaleDateString()}
        </ThemedText>
      </View>
      <Pressable
        onPress={() => deleteSession(session.id)}
        style={styles.deleteButton}
      >
        <Feather name="trash-2" size={16} color={theme.error} />
      </Pressable>
    </Pressable>
  );

  return (
    <ThemedView style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* Header with Profile */}
      <View style={[styles.drawerHeader, { backgroundColor: theme.drawerHeaderBackground }]}>
        <Image
          source={require('../assets/images/user-avatar.png')}
          style={styles.avatar}
        />
        <ThemedText style={styles.userName}>{userName}</ThemedText>
        <Pressable style={styles.settingsButton} onPress={navigateToSettings}>
          <Feather name="settings" size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search conversations..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
        />
      </View>

      {/* Session List */}
      <ScrollView style={styles.sessionList} showsVerticalScrollIndicator={false}>
        {filteredSessions.length === 0 ? (
          <ThemedText style={styles.placeholderText}>
            {searchText ? 'No matches found' : 'No conversations yet'}
          </ThemedText>
        ) : (
          filteredSessions.map(renderSession)
        )}
      </ScrollView>

      {/* New Chat FAB */}
      <Pressable style={[styles.newChatButton, { backgroundColor: theme.primary }]} onPress={createNewSession}>
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

function ChatNavigator() {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        headerTintColor: theme.text,
      }}
    >
      <Stack.Screen
        name="ChatMain"
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}

export default function DrawerNavigator() {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 280,
          backgroundColor: theme.drawerBackground,
        },
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.text,
        headerTransparent: true,
      }}
    >
      <Drawer.Screen
        name="Chat"
        component={ChatNavigator}
        options={{
          title: 'New Chat',
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userName: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg + 20,
    fontSize: Typography.small.fontSize,
  },
  sessionList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: Spacing['5xl'],
    opacity: 0.5,
  },
  newChatButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 4,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  sessionPreview: {
    fontSize: Typography.small.fontSize - 1,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: Typography.small.fontSize - 2,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
});