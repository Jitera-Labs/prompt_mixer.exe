# Prompt Mixer Application Specification

## Technology Stack
- **Framework**: Tauri, React, Vite, TypeScript
- **AI SDK**: Vercel AI SDK (unified provider system)
- **Icons**: Phosphor Icons (https://phosphoricons.com/)
- **Database**: SQLite (local storage via Tauri)
- **Markdown**: Vercel's streamdown library for rich markdown rendering
- **Security**: Tauri secure store for API credentials

## App Shell Layout
```
Header                      Actions |
------------------------------------|
Sidebar  |   Chat   | Prompt Mixer  |
         |      Hi  |               |
Chat 1 x | Hello    |               |
Chat 2   |      ... |               |
         |          |               |
         | | Input| |               |
```

### Layout Specifications
- **Sidebar**: Max width 400px
- **Chat Area**: Max width 600px
- **Prompt Mixer**: Takes remaining space
- All panels are **resizable** by the user

## App Pages
- **Welcome screen**: First-run LLM provider configuration (URL, API key, model)
- **Main app screen**: Header, sidebar, chat area, and prompt mixer area
- **Settings page**: LLM provider configuration, theme, startup options

## Empty States
- **No chat selected**: Chat area shows welcome message with "Start a new chat" prompt
- **Empty chat list**: Sidebar shows "No chats yet" with New Chat button highlighted
- **First message**: Prompt mixer initializes with default anchor configuration (Neutral at 100%)

## Chat Metadata
- **Chat titles**: Auto-generated from first user message (first 50 chars, trimmed at word boundary)
- **Title editing**: User can click to edit chat title inline
- **Timestamps**:
  - Display format: "Just now", "5m ago", "2h ago", "Yesterday", "Jan 15"
  - Stored as ISO 8601 strings in database
  - Last message timestamp shown in chat list preview
  - Individual message timestamps on hover

## Model Parameters
- **Configuration level**: Global settings (applied to all chats)
- **Exposed parameters**:
  - Model selection (dropdown of available models for provider)
  - Temperature (0.0-2.0, default 0.7)
  - Max tokens (1-8192, default 2048)
  - Top P (0.0-1.0, default 1.0)
- **Location**: Settings page, "Model Configuration" section
- **Meta-mixing parameters** (hardcoded for prompt mixing):
  - Max tokens: 512 (for mix generation)
  - Max tokens: 2 (for midtoken continuation)

## Error Handling
- **API failures**:
  - Display error toast with retry button
  - Show error inline in chat with "Retry" and "Edit message" options
  - Log errors to console for debugging
- **Network issues**:
  - Show "Connection lost" indicator in header
  - Queue messages for retry when connection restored
- **Invalid credentials**:
  - Redirect to settings with error message
  - Highlight credential fields in red
- **Rate limits**: Display "Rate limit exceeded, retry in Xs" with countdown
- **Streaming interruption**: Show "Generation interrupted" with resume option

## Keyboard Shortcuts
- **Ctrl/Cmd + N**: New chat
- **Ctrl/Cmd + K**: Focus chat input
- **Enter**: Send message (Shift+Enter for newline)
- **Escape**: Cancel current generation
- **Ctrl/Cmd + ,**: Open settings
- **Up Arrow** (in empty input): Edit last user message

## Additional UI Features
- **Copy message**: Button on message hover (copies markdown to clipboard)
- **Message editing**: Edit icon on user messages, resends from that point
- **Regenerate response**: Button on assistant messages (resends last user message)
- **Window dimensions**:
  - Minimum: 800x600px
  - Default: 1200x800px
  - Remember last size/position in app state

## UI Components

### Header Actions
- **Settings**: Opens settings page for LLM provider configuration, theme, startup options

### Sidebar (Chat List)
- List of chats with name and last message preview
- **New Chat** button at the top of the list
- Each chat item has a **delete button** (×)
- Clicking on a chat opens it in the main area
- Chats are stored in local SQLite database

### Chat Area
- **Messages**: Displays chat messages with sender name and content
- **Rich Markdown**: Support via Vercel's [streamdown](https://github.com/vercel/streamdown) library
- **Input Area**: Message input field with send button
- **Message Controls**: Each message has options to:
  - Stop current generation (during streaming)
  - Resend message (resumes conversation from that point)
  - Edit message (resends edited version, resumes conversation)
  - Copy message (copies markdown to clipboard)

### Prompt Mixer Area
- **Canvas View**: 2D interactive canvas with draggable anchors (adapted from `./reference/promx`)
  - Main canvas for anchor/handle interaction (fills available height)
  - **Floating Controls** (top-left corner):
    - Play/Pause button (toggles generation pause state)
    - Speed button (toggles slow/fast, uses snail/rabbit icons from Lucide/Phosphor)
    - Buttons: rounded (#rgba(255,255,255,0.1)), hover effect
  - **Status Indicator** (top-center):
    - Shows current state: "Mixing", "Writing", "Done", or empty
    - Rounded badge with semi-transparent background
    - Displays blender icon when mixing
  - **Connection Indicator** (top-right corner):
    - Small circle (12px) showing connection status
    - Green glow when connected, red when error, gray when disconnected
  - **Value Display Panel** (bottom, 260px height):
    - Grid layout (3 columns on desktop, 2 on mobile) showing all anchor values
    - Each item displays: icon, label, horizontal bar, numeric value (0.00-1.00)
    - Bar color matches anchor color
    - Bar width represents current weight percentage
    - Smooth transitions as values change
    - Dark background (#1e1e1e) with subtle hover effects
- **Presets View**: Sub-view for managing anchor configurations (similar to chat list UI)
  - List of saved presets
  - Add/edit/remove anchors
  - Configure anchor labels, prompts, icons, and colors (Phosphor Icons)
  - Save/load preset configurations
  - Button to switch between Canvas and Presets views

# User flow:
- Open the app, see a welcome screen allowing to configure LLM provider
- After configuration, see the main app screen with an empty chat list and pre-configured prompt mixer area (same as in the reference implementation)
- User sends a message in the chat, which is displayed in the chat area
- Prompt mixer workflow runs and allows user to adjust the generation on the fly (see the reference implementation for details)

## Prompt Mixing UI
- See `./reference/promx` for the reference UI implementation
- **Canvas**: 2D interactive area with "anchors" representing different prompt modifiers
- **Draggable Handle**: Central handle (blue circle) that user drags to adjust anchor influences
  - Not an anchor itself, but a position indicator
  - Anchors remain fixed in their positions
  - Handle position determines weight of each anchor
- **Draggable Anchors**: User can also drag individual anchors to reposition them on canvas
- **Distance-Based Influence**: Anchor weight (0.0-1.0) calculated based on handle distance from each anchor

### Weight Calculation Algorithm
For each anchor, given handle position:
```
distance = distance between handle and anchor center
if distance <= EMOTION_ICON_RADIUS (15px):
  weight = 1.0
else if distance <= anchor.D_influence (influence radius):
  normalizedDist = (distance - EMOTION_ICON_RADIUS) / (D_influence - EMOTION_ICON_RADIUS)
  weight = 1 - normalizedDist
else:
  weight = 0.0
```

### Canvas Constants
```typescript
HANDLE_RADIUS: 10px
EMOTION_ICON_RADIUS: 15px
ICON_FONT_BASE_SIZE: 20px
ICON_FONT_SCALE_MAX_ADDITION: 20px (scales with weight)
PLACEMENT_RADIUS_FACTOR: 0.7 (of canvas radius)
INFLUENCE_RADIUS_FACTOR: 0.35 (of canvas dimension)
LERP_SPEED: 0.02 (for smooth value transitions)
POSITION_LERP_SPEED: 0.12 (for smooth position transitions)
MIN_DELTA: 0.001 (threshold for change detection)
```

### Anchor Initial Placement
- **Neutral anchor**: Placed at canvas center
- **Other anchors**: Arranged in a circle around center
  - Radius = min(canvas width, canvas height) * PLACEMENT_RADIUS_FACTOR
  - Evenly distributed: angle = (index / totalNonNeutral) * 2π
  - Position: (centerX + radius * cos(angle), centerY + radius * sin(angle))

### Visual Effects
- **Anchor appearance**:
  - Background glow with color intensity based on weight
  - Icon size scales: baseSize + (weight * maxAddition)
  - Icon saturation: 0% at weight 0.0, 120% at weight 1.0
  - Opacity increases with weight (0.4 base, up to 0.9)
  - Multi-layered glow effect when weight > 0.05
- **Handle appearance**:
  - Flat blue color: rgba(100, 200, 255, 0.9)
  - Outer glow with 15px blur
  - White border (3px) with semi-transparent shadow
- **Smooth animations**:
  - Position lerping for anchor dragging
  - Value lerping for weight transitions
  - Responsive canvas resize with anchor repositioning

### Interaction Behavior
- **Mixing Behavior**: Debounced automatic mixing (500ms) as user drags
- **Drag modes**:
  - Drag handle to change weights (anchors stay fixed)
  - Drag anchor itself to reposition (only that anchor moves)
- **Cursor states**: pointer (hovering), grabbing (dragging)
- **Visual Feedback**:
  - Status indicator shows "Mixing" or "Writing" state
  - Real-time weight bars showing numeric values (0.00-1.00)
  - Smooth animations for all transitions
- **Generation Control**:
  - Pause/Resume: Temporarily halts/resumes token generation
  - Speed control: Slow (0.5s between tokens) or Fast (no delay)
  - Both controls accessible in Prompt Mixer floating buttons

## Prompt Mixing Backend
- See `./reference/proxy/promx.py` for the reference implementation
- Reimplement this workflow using Vercel AI SDK primitives and API

### Mixing Algorithm
1. **Initial Generation**: Mixed prompt is generated from weighted anchors and sent to chat completions API
2. **Dynamic Remixing**: When user adjusts anchors during generation:
   - Cancel pending completion stream
   - Capture all text generated so far (including partial/unfinished responses)
   - Generate new mixed prompt from updated anchor weights
   - Resend complete conversation state with:
     - All previous messages
     - Partial assistant response as the last assistant message
     - New mixed prompt injected as system message with instructions to continue
3. **Continuation**: LLM continues generation from exact point where previous stream stopped

### Mixing Process
- **Single Anchor** (weight > 0): Use that anchor's prompt directly
- **Multiple Anchors**: Send anchors with weights > 0 to meta-prompt that creates composite prompt
- **Meta-Prompt**: Instructs LLM to blend source prompts based on weights (see reference)
- **Debouncing**: 500ms debounce on anchor position changes before triggering remix
- **Speed Control**:
  - Slow: 0.5s sleep between token batches
  - Fast: No sleep (max speed)

### Default Anchors
Same as reference implementation with specific colors:
- **Happiness** 😄 - #FFD700 (gold)
- **Love** ❤️ - #FF69B4 (hot pink)
- **Desire** 🔥 - #FF4500 (orange red)
- **Surprise** 😲 - #FFFF00 (yellow)
- **Confusion** 😕 - #D3D3D3 (light gray)
- **Sarcasm** 😏 - #008080 (teal)
- **Anger** 😠 - #DC143C (crimson)
- **Disgust** 🤢 - #556B2F (dark olive green)
- **Fear** 😱 - #800080 (purple)
- **Sadness** 😢 - #1E90FF (dodger blue)
- **Guilt** 😔 - #6A5ACD (slate blue)
- **Shame** 🙈 - #A0522D (sienna)
- **Neutral** 😐 - #808080 (gray) - at 100% weight by default, positioned at center

All anchors fully customizable (label, prompt, icon, color)

## Technical Details

### Data Persistence
- **Database**: SQLite (Tauri's standard approach)

#### Database Schema
```sql
CREATE TABLE chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);

CREATE TABLE anchor_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE preset_anchors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  preset_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  prompt TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  influence_radius REAL NOT NULL,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (preset_id) REFERENCES anchor_presets(id) ON DELETE CASCADE
);

CREATE INDEX idx_preset_anchors_preset_id ON preset_anchors(preset_id);

CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Stores: active_preset_id, window_bounds, theme, etc.
```

- **Credentials**: Stored in Tauri secure store (encrypted)
- **Context management**: Full conversation history sent with each request
  - No truncation in initial version
  - Future: implement token counting and sliding window

### LLM Provider Configuration
- **System**: Vercel AI SDK unified provider system
- **Initial Setup**: Single provider at a time
- **Configuration**: Provider URL, API key, model selection
- **Security**: All credentials stored in Tauri secure store
- **Welcome Screen**: First-run setup for provider configuration

### Anchor Management
- **UI Location**: Sub-view within Prompt Mixer area
- **Capabilities**:
  - Add new anchors with custom label, prompt, icon, and color
  - Edit existing anchors (all properties)
  - Remove anchors (except when only one remains)
  - Reset anchor positions to default circular arrangement
  - Save current configuration as named preset (includes positions)
  - Load previously saved presets
- **Icons**: Select from Phosphor Icons library
- **Colors**: Hex color picker for anchor glow/background
- **Storage**: Presets saved to SQLite database with:
  - Anchor configurations (label, prompt, icon, color)
  - Anchor positions (x, y coordinates)
  - Influence radius for each anchor
  - Preset name and timestamp
