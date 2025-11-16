# AI Chat App - Complete Testing Checklist

## Prerequisites
- [ ] Scan QR code with Expo Go on your mobile device
- [ ] Pull down to refresh if already open
- [ ] Verify app loads without crashes

## 🎯 Core Chat Features

### Basic Messaging
- [ ] Type "Hello, how are you?" and send
- [ ] Verify message appears in chat bubble
- [ ] Verify loading indicator shows while waiting
- [ ] Verify AI response appears with streaming effect
- [ ] Verify response is coherent and relevant

### Multi-turn Conversation
- [ ] Send "What's React Native?"
- [ ] After response, send "What are its main advantages?"
- [ ] Verify AI maintains context from previous message
- [ ] Send a third message "Can you give me a code example?"
- [ ] Verify conversation flows naturally

### Long Messages
- [ ] Type a very long message (100+ words)
- [ ] Verify input field expands properly
- [ ] Verify message sends correctly
- [ ] Verify long AI responses display properly

## 🎤 Voice Features

### Voice Recording
- [ ] Tap microphone button in header
- [ ] Verify voice recorder modal appears
- [ ] Record a short message
- [ ] Stop recording
- [ ] Verify recorded message is transcribed and sent
- [ ] Verify AI responds to voice message

### Advanced Voice Features (if enabled)
- [ ] Test continuous recording mode
- [ ] Test pause/resume recording
- [ ] Verify waveform visualization works
- [ ] Test automatic silence detection

### Text-to-Speech
- [ ] Go to Settings
- [ ] Enable "Auto-play TTS"
- [ ] Send a message to get AI response
- [ ] Verify AI response is spoken automatically
- [ ] Adjust speech rate in settings
- [ ] Test TTS with new speech rate

## 📱 Navigation & UI

### Drawer Navigation
- [ ] Tap menu icon (three lines)
- [ ] Verify drawer slides open
- [ ] Verify user avatar displays
- [ ] Verify user name shows correctly
- [ ] Verify settings gear icon is visible
- [ ] Verify search bar is present
- [ ] Verify session list displays
- [ ] Tap outside drawer to close
- [ ] Verify drawer closes smoothly

### Settings Screen
- [ ] Open drawer and tap settings icon
- [ ] Verify navigation to Settings works
- [ ] Verify "OpenAI API Key" shows "Configured via environment variables"
- [ ] Verify green checkmark appears next to API status
- [ ] Change user name to something unique
- [ ] Toggle Dark Mode
- [ ] Toggle Haptic Feedback
- [ ] Adjust Speech Rate with +/- buttons
- [ ] Tap Save
- [ ] Verify settings save successfully
- [ ] Tap back arrow
- [ ] Verify return to chat screen

### Theme Testing
- [ ] Toggle dark mode in settings
- [ ] Save and return to chat
- [ ] Verify all screens update to dark theme
- [ ] Verify text remains readable
- [ ] Toggle back to light mode
- [ ] Verify theme changes throughout app

## 💾 Session Management

### Create New Session
- [ ] Open drawer
- [ ] Tap floating "+" button
- [ ] Verify new empty chat session created
- [ ] Send a message in new session
- [ ] Verify session gets automatic title

### Switch Sessions
- [ ] Create 3 different chat sessions with distinct topics
- [ ] Open drawer
- [ ] Tap on different session
- [ ] Verify correct messages load
- [ ] Switch to another session
- [ ] Verify sessions maintain separate conversations

### Delete Session
- [ ] Open drawer
- [ ] Tap trash icon on a session
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify session removed from list
- [ ] Verify cannot navigate to deleted session

## 🔍 Search Features

### Basic Search
- [ ] Open drawer
- [ ] Type keyword from a previous conversation
- [ ] Verify sessions filter to show matches
- [ ] Clear search
- [ ] Verify all sessions reappear

### Semantic Search
- [ ] Search for concept (e.g., "programming" when you discussed "coding")
- [ ] Verify semantically related sessions appear
- [ ] Test with synonym searches

## 📤 Export & Sharing

### Export Conversation
- [ ] Tap three dots menu in header
- [ ] Select Export option
- [ ] Choose Text format
- [ ] Verify export includes all messages
- [ ] Try JSON format
- [ ] Verify JSON structure is valid
- [ ] Try Markdown format
- [ ] Verify markdown formatting is correct

## 🤖 AI Summarization

### Generate Summary
- [ ] Have a conversation with 5+ messages
- [ ] Tap three dots menu
- [ ] Select Summary option
- [ ] Verify summary modal appears
- [ ] Verify summary captures key points
- [ ] Verify conversation metrics display
- [ ] Check action items extraction
- [ ] Close summary modal

## 📴 Offline Mode

### Offline Behavior
- [ ] Turn on airplane mode
- [ ] Send a message
- [ ] Verify offline indicator appears
- [ ] Verify message queued (not lost)
- [ ] Turn off airplane mode
- [ ] Verify queued message sends automatically
- [ ] Verify AI response arrives

## 🎨 UI Polish

### Visual Elements
- [ ] Verify all icons render correctly (Ionicons)
- [ ] Check send button enables/disables properly
- [ ] Verify loading spinners appear during operations
- [ ] Check message timestamps display
- [ ] Verify user/AI message bubbles are distinct
- [ ] Test landscape orientation (if applicable)

## ⚠️ Error Handling

### API Errors
- [ ] Test with very long message (1000+ words)
- [ ] Verify error handling if API fails
- [ ] Check error messages are user-friendly

### Edge Cases
- [ ] Send empty message (should be disabled)
- [ ] Rapidly send multiple messages
- [ ] Try special characters and emojis
- [ ] Test with no internet (airplane mode)

## 🎯 Performance

### Responsiveness
- [ ] Scroll through long conversation
- [ ] Verify smooth scrolling
- [ ] Switch between sessions quickly
- [ ] Verify no lag or freezing
- [ ] Open/close drawer repeatedly
- [ ] Check for memory leaks or crashes

### Data Persistence
- [ ] Close app completely
- [ ] Reopen app
- [ ] Verify all sessions persist
- [ ] Verify settings persist
- [ ] Verify messages intact

## ✅ Final Verification

- [ ] App feels responsive and polished
- [ ] No crashes during testing
- [ ] All core features work
- [ ] UI is consistent throughout
- [ ] Error messages are helpful
- [ ] Offline mode works correctly
- [ ] Settings changes apply immediately
- [ ] Export formats are correct
- [ ] Voice features work smoothly
- [ ] Search returns relevant results

## Testing Notes

**Known Working Features:**
- OpenAI API integration (auto-configured via environment variable)
- Streaming AI responses
- Session management
- Settings persistence
- Icon rendering (Ionicons)
- Navigation between screens
- Offline queue system
- Vector database search
- Export functionality
- Summarization service

**Platform-Specific:**
- This app is optimized for mobile devices via Expo Go
- Web version may have limited functionality
- Best tested on actual iOS/Android devices

---

**Test Date:** ___________
**Tester:** ___________
**Device:** ___________
**OS Version:** ___________
**Issues Found:** 

1. ___________
2. ___________
3. ___________