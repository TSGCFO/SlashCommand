# AI Chat Application - Design Guidelines

## Architecture Decisions

### Authentication
**No Authentication Required** - This is a single-user, utility-focused chat application with local data storage.

**Profile/Settings Screen Required:**
- User-customizable avatar (1 preset: minimal bot icon with gradient)
- Display name field (default: "User")
- App preferences:
  - Theme toggle (Light/Dark)
  - Voice settings (speech rate, voice selection)
  - Haptic feedback toggle
  - Auto-play TTS toggle

### Navigation Architecture
**Drawer Navigation** - Optimal for chat history management with many sessions.

**Navigation Structure:**
- **Drawer (Left Side):**
  - Header: User profile section with avatar and name
  - Search bar for filtering sessions
  - Session list (scrollable) with auto-generated titles
  - "New Chat" action button at top
  - Settings access at bottom
  
- **Main Content:**
  - Active chat screen (full-screen conversation view)
  - Voice recording overlay (modal)

### Screen Specifications

#### 1. Chat Screen (Main)
**Purpose:** Real-time conversation with AI assistant

**Layout:**
- **Header:** Custom transparent header
  - Left: Drawer menu icon (hamburger)
  - Center: Session title (truncated, tap to edit)
  - Right: Voice input button, overflow menu (3-dot)
  - No search bar in header
  
- **Main Content Area:**
  - ScrollView (inverted, newest at bottom)
  - Message bubbles with timestamps
  - Typing indicator during streaming
  - Pull-to-refresh at top to load older messages
  
- **Footer:** Fixed message input bar
  - Text input field with multi-line support
  - Send button (always visible)
  - Voice input button (hold to record)
  - Microphone icon transforms to waveform during recording

- **Safe Area Insets:**
  - Top: `headerHeight + Spacing.xl`
  - Bottom: `insets.bottom + 80` (account for input bar + spacing)

**Components:**
- Message bubbles (user: right-aligned, AI: left-aligned)
- Timestamp labels (subtle, below each message)
- Streaming text animation
- Audio playback controls (play/pause, waveform visualization)
- Long-press menu (copy, regenerate, speak, delete)
- Swipe-to-delete gesture on messages

#### 2. Drawer (Session List)
**Purpose:** Navigate between conversations and manage chat history

**Layout:**
- **Header:** Fixed profile section
  - Avatar (48x48)
  - Display name
  - Settings gear icon (right)
  
- **Search Bar:** Sticky below header
  - Placeholder: "Search conversations..."
  - Semantic search indicator icon
  
- **Session List:** Scrollable
  - Each item: Title, preview text, timestamp
  - Swipe-left reveals delete button
  - Long-press shows context menu (rename, delete, pin)
  
- **New Chat Button:** Floating action button
  - Position: Bottom-right of drawer
  - Icon: Plus symbol
  - Shadow: width: 0, height: 2, opacity: 0.10, radius: 2

- **Safe Area Insets:**
  - Top: `insets.top + Spacing.xl`
  - Bottom: `insets.bottom + Spacing.xl`

#### 3. Settings Screen (Modal)
**Purpose:** Configure app preferences and user profile

**Layout:**
- **Header:** Standard navigation header
  - Left: Back/Close button
  - Center: "Settings" title
  - Right: None
  
- **Main Content:** ScrollView with form sections
  - Profile section (avatar picker, name input)
  - Voice settings section
  - Appearance section (theme selector)
  - Feedback section (haptics toggle)
  - About section
  
- **Form Structure:**
  - Section headers with dividers
  - Toggle switches for boolean settings
  - Segmented controls for theme
  - Picker for voice selection
  
- **Safe Area Insets:**
  - Top: `Spacing.xl` (opaque header)
  - Bottom: `insets.bottom + Spacing.xl`

#### 4. Voice Recording Overlay (Native Modal)
**Purpose:** Visual feedback during voice recording

**Layout:**
- Semi-transparent backdrop (blur effect)
- Centered recording indicator
  - Animated waveform visualization
  - Duration timer
  - "Release to send" instruction
- Cancel zone at bottom (swipe down to cancel)

## Design System

### Color Palette
**Light Mode:**
- Primary: `#007AFF` (iOS blue)
- Background: `#FFFFFF`
- Surface: `#F2F2F7`
- User Bubble: `#007AFF`
- AI Bubble: `#E9E9EB`
- Text Primary: `#000000`
- Text Secondary: `#8E8E93`
- Border: `#C6C6C8`
- Error: `#FF3B30`
- Success: `#34C759`

**Dark Mode:**
- Primary: `#0A84FF`
- Background: `#000000`
- Surface: `#1C1C1E`
- User Bubble: `#0A84FF`
- AI Bubble: `#2C2C2E`
- Text Primary: `#FFFFFF`
- Text Secondary: `#8E8E93`
- Border: `#38383A`
- Error: `#FF453A`
- Success: `#32D74B`

### Typography
- **Display:** SF Pro Display, 28pt, Bold (session titles in empty state)
- **Title:** SF Pro Text, 20pt, Semibold (screen headers)
- **Body:** SF Pro Text, 17pt, Regular (messages)
- **Caption:** SF Pro Text, 13pt, Regular (timestamps, metadata)
- **Input:** SF Pro Text, 17pt, Regular (text input)

### Visual Design

**Icons:**
- Use SF Symbols for iOS-native icons (microphone, paperclip, ellipsis)
- Use Feather icons from @expo/vector-icons for cross-platform (send, settings, menu)
- No emojis in UI chrome

**Message Bubbles:**
- User: Right-aligned, primary color background, white text
- AI: Left-aligned, surface color background, primary text
- Border radius: 18pt
- Padding: 12pt vertical, 16pt horizontal
- Max width: 75% of screen width
- Tail optional (can be subtle rounded corner instead)

**Touchable Feedback:**
- Message bubbles: Opacity 0.7 on press
- List items: Surface color highlight on press
- Buttons: Scale 0.95 on press
- Floating action button: Shadow as specified + scale 0.95

**Floating Button Shadow (Voice, New Chat):**
- shadowOffset: { width: 0, height: 2 }
- shadowOpacity: 0.10
- shadowRadius: 2
- elevation: 4 (Android)

**Haptic Feedback Triggers:**
- Message sent (light impact)
- Voice recording start/stop (medium impact)
- Message deleted (notification warning)
- Session created (light impact)
- Long-press menu opened (medium impact)
- Pull-to-refresh triggered (light impact)

### Critical Assets

**Generated Assets (Required):**
1. **User Avatar Preset:** Minimalist gradient circle with abstract human silhouette (single color to gradient: primary to lighter shade)
2. **Empty State Illustration:** Simple line art of chat bubble with sparkles (AI theme), centered on empty chat screen
3. **App Icon:** Gradient speech bubble with subtle AI sparkle/star element, rounded corners per iOS guidelines

**System Icons (Standard):**
- Microphone (voice input)
- Send arrow (message send)
- Hamburger menu (drawer)
- Settings gear
- Plus (new chat)
- Ellipsis (overflow menu)
- Trash (delete)
- Copy, regenerate symbols

### Interaction Design

**Gestures:**
- **Swipe left on message:** Quick delete (with undo toast)
- **Swipe left on session:** Reveal delete button
- **Long-press message:** Context menu (copy, regenerate, speak, delete)
- **Long-press session:** Context menu (rename, delete, pin)
- **Pull down on chat:** Refresh/load older messages
- **Hold voice button:** Start recording, release to send, slide up to cancel

**Loading States:**
- Streaming text: Cursor blink animation, text appears word-by-word
- Voice recording: Animated waveform visualization
- Message sending: Subtle opacity on message until confirmed
- Pull-to-refresh: Standard iOS/Android spinner

**Accessibility:**
- Minimum touch target: 44x44pt
- VoiceOver labels on all interactive elements
- High contrast mode support
- Dynamic type support (scale typography)
- Reduced motion: Disable streaming animation, use instant appearance
- Voice controls fully accessible via VoiceOver