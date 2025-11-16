# AI Chat Application

## Overview

This is a cross-platform AI chat application built with React Native and Expo. The app provides a conversational interface with OpenAI's GPT models, featuring voice recording, conversation management, offline support, semantic search capabilities, AI-powered summarization, and advanced export functionality. It's designed as a single-user utility application with local data persistence and no authentication requirements.

## Recent Changes (November 16, 2025)

### Critical UI Rendering Fixes
1. **Font Loading Issue**: Fixed icons showing as Chinese characters/boxes in Expo Go by adding `useFonts` hook in App.tsx to load Ionicons and Feather fonts before rendering
2. **Environment Variable Access**: Replaced broken `process.env` usage with Expo Constants by:
   - Converting app.json to app.config.js for dynamic configuration
   - Creating config service (utils/config.ts) for centralized environment variable access
   - Updating OpenAI service to use config service
3. **Inverted List Empty State**: Fixed upside-down empty state in ChatScreen by conditionally rendering outside inverted FlatList
4. **Theme Destructuring**: Fixed inconsistent theme usage across ChatScreen, SettingsScreen, and DrawerNavigator
5. **Safe Area Layout**: Fixed keyboard offset and padding issues for proper input field positioning
6. **Package Updates**: Updated expo-glass-effect and react-native-svg to match Expo SDK 54 requirements

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- Uses the new React Native architecture (enabled via `newArchEnabled: true`)
- React 19.1.0 with experimental React Compiler support
- TypeScript for type safety

**Navigation Pattern**: Drawer-based navigation
- **Problem**: Need to manage multiple chat sessions with easy access to history
- **Solution**: Left-side drawer navigation containing session list, search, and user profile
- **Rationale**: Drawer navigation provides optimal UX for chat history management, allowing users to quickly switch between conversations without cluttering the main chat interface

**State Management**: Local React state with hooks
- No global state management library (Redux/MobX) used
- Component-level state management using React hooks
- **Rationale**: Application complexity doesn't warrant additional state management overhead; local state with prop drilling is sufficient

**UI Components**:
- Custom themed components (`ThemedView`, `ThemedText`) for consistent light/dark mode support
- Reanimated 4.1.1 for smooth animations and gestures
- Gesture Handler for swipe interactions
- Keyboard Controller for keyboard-aware layouts
- Safe Area Context for proper inset handling across devices

**Design System**:
- Centralized theme constants (`constants/theme.ts`) with elevation-based background colors
- Supports both light and dark modes with iOS-style color schemes
- Consistent spacing, typography, and border radius values

### Data Architecture

**Local Storage**: AsyncStorage
- **Problem**: Need persistent storage for chat sessions, messages, and user preferences
- **Solution**: AsyncStorage for simple key-value persistence
- **Data Structure**:
  - Sessions: Array of conversation sessions with messages
  - Messages: Individual chat messages with role (user/assistant), content, and timestamps
  - User Preferences: Settings like name, theme, haptic feedback, TTS preferences

**Vector Database**: Custom in-memory implementation
- **Problem**: Enable semantic search across chat history
- **Solution**: Local vector database using embeddings from OpenAI
- **Implementation**: In-memory Map structure with AsyncStorage persistence
- **Features**: Cosine similarity search, embedding caching for performance

**Offline Queue System**:
- **Problem**: Handle network interruptions gracefully
- **Solution**: Queue-based system for pending API requests
- **Features**: Automatic retry logic, sync status tracking, network state monitoring via NetInfo

### AI Integration

**OpenAI API Integration**:
- Direct API calls to OpenAI's endpoints (no SDK dependency)
- Supports chat completions with streaming responses
- Automatic session title generation
- Model: GPT-3.5-turbo (configurable)

**Voice Features**:
- **Input**: expo-av for audio recording with waveform visualization
- **Output**: expo-speech for text-to-speech playback
- Voice activity detection for automatic recording stop

**Conversation Analysis**:
- Automatic summarization service
- Key point extraction
- Topic identification
- Sentiment analysis
- Action item detection

### Export & Sharing

**Export Formats**:
- Plain text
- JSON (full session data)
- Markdown

**Implementation**: expo-sharing and expo-file-system for cross-platform file operations

### AI Summarization & Insights

**Features**:
- Automatic conversation summarization
- Key points extraction
- Action items detection
- Topic identification
- Sentiment analysis
- Conversation flow metrics

**Implementation**: SummarizationService with OpenAI API integration

### Advanced Voice Features

**Capabilities**:
- Continuous recording mode
- Voice Activity Detection (VAD)
- Automatic segmentation on silence
- Multi-segment handling
- Real-time sound level visualization
- Pause/resume functionality

**Implementation**: AdvancedVoiceRecorder component with expo-av

### Offline Mode & Sync

**Features**:
- Automatic message queuing when offline
- Background sync when connection restored
- Retry logic for failed messages
- Network status monitoring
- Visual offline indicator

**Implementation**: OfflineQueueService with NetInfo and AsyncStorage

### Error Handling

**Error Boundary**: Class-based error boundary component
- Catches React component errors
- Provides fallback UI with error details (dev mode)
- Allows app restart or error reset

### Platform Support

**Target Platforms**:
- iOS (with tablet support)
- Android (edge-to-edge, adaptive icons)
- Web (single-page output)

**Platform-Specific Considerations**:
- Web fallback for KeyboardAwareScrollView (uses regular ScrollView)
- Conditional rendering based on Platform.OS
- Replit deployment support with custom build scripts

## External Dependencies

### Third-Party Services

**OpenAI API**:
- **Purpose**: AI chat completions, embeddings, title generation
- **Authentication**: API key stored in AsyncStorage
- **Endpoints Used**: `/v1/chat/completions`

### Core Libraries

**React Navigation** (v7.x):
- Drawer Navigator for main navigation
- Native Stack Navigator for modal flows
- Provides navigation state management

**Expo Modules**:
- `expo-av`: Audio recording and playback
- `expo-speech`: Text-to-speech synthesis
- `expo-file-system`: File operations for exports
- `expo-sharing`: Cross-platform sharing
- `expo-clipboard`: Copy functionality
- `expo-haptics`: Tactile feedback
- `expo-document-picker`: File selection
- `expo-blur`: Visual effects for modals
- `expo-web-browser`: OAuth and external links
- `expo-constants`: Environment variables access
- `expo-linking`: Deep linking support

**UI & Animation**:
- `react-native-reanimated`: High-performance animations
- `react-native-gesture-handler`: Touch gesture system
- `react-native-svg`: Vector graphics
- `@expo/vector-icons`: Icon library (Feather icons used)

**Utilities**:
- `uuid`: Unique ID generation for messages and sessions
- `@react-native-async-storage/async-storage`: Persistent storage
- `@react-native-community/netinfo`: Network status monitoring
- `react-native-keyboard-controller`: Advanced keyboard handling

### Development Tools

- ESLint with Expo configuration
- Prettier for code formatting
- TypeScript for type checking
- Babel with module resolver for `@/` path aliasing

### Notable Architecture Decisions

**No Database**: Uses AsyncStorage instead of SQLite or other databases
- **Rationale**: Simplifies architecture for single-user application; AsyncStorage is sufficient for chat history storage

**No Authentication**: Single-user application design
- **Rationale**: Designed as personal utility; authentication adds unnecessary complexity

**Custom Vector DB**: In-memory implementation instead of external vector database
- **Rationale**: Keeps app self-contained; acceptable performance for personal chat history scale

**Direct API Calls**: No OpenAI SDK dependency
- **Rationale**: Reduces bundle size; only need basic chat completion functionality

**Expo Managed Workflow**: Uses Expo's managed workflow rather than bare React Native
- **Rationale**: Simplifies development, testing, and deployment; provides comprehensive module ecosystem