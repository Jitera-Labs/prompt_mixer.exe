# Prompt Mixer Style Guide: Norton Commander TUI

This document outlines the strict styling guidelines for Prompt Mixer. The application mimics the aesthetic of retro DOS file managers (specifically Norton Commander) using modern web technologies (React/CSS).

## Core Philosophy

1.  **Functionality over Form**: The UI is brutalist, high-contrast, and keyboard-centric.
2.  **"Simple is Better than Easy"**: Use standard HTML/CSS structures. Avoid complex overlays or floating elements unless absolutely necessary.
3.  **Strictly Retro**: No rounded corners, no gradients forms, no soft shadows, no animations.
4.  **TUI Simulation**: Everything should look like it could be rendered in a text-mode terminal (mostly).

## Color Palette (CSS Variables)

Use these variables defined in `global.css`. Do not use hex codes directly.

| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--nc-blue` | `#000000` | Main background for panels, dialogs. |
| `--nc-cyan` | `#00AAAA` | Accents, selected items, highlights. |
| `--nc-yellow` | `#FFFF55` | Warnings, headers, active states. |
| `--nc-white` | `#AAAAAA` | Standard text. |
| `--nc-bright-white` | `#FFFFFF` | Borders, strong text. |
| `--nc-black` | `#000000` | Screen background, input backgrounds. |
| `--nc-gray` | `#AAAAAA` | Secondary borders/elements. |

## Typography

*   **Font**: `'Geist Pixel', monospace` (applied globally).
*   **Case**: **UPPERCASE** for all UI elements, labels, buttons, and inputs.
    *   *Exception*: User generated content (chat messages, prompts) can be mixed case.
    *   *CSS*: `text-transform: uppercase` is applied to `body`, inputs, and buttons by default.
*   **Size**: Default `18px`.

## UI Components & CSS Classes

Always use these semantic classes. Do not create new styled components if a standard class exists.

### Panels & Containers
*   `.nc-screen`: The root container for a full-page view. Background `--nc-black`.
*   `.nc-panel`: The main container for content. Background `--nc-blue`, `4px double` border.
*   `.nc-center`: Utility to center a panel on the screen (flexbox).

### Forms & Inputs
Inputs must be 100% width of their container and look like simple text fields.

*   `.nc-form`: Grid container for form elements.
*   `.nc-field`: detailed wrapper for Label + Input.
*   `.nc-label`: Label text. Color `--nc-warn` (Yellow).
*   `.nc-input`: Standard text input. Bg `--nc-black`, Border `--nc-border`. **No border radius**.
*   `.nc-select`: Select dropdown.
    *   **Crucial**: Must use `appearance: none`.
    *   **Indicator**: Use text characters (e.g., `v` or `▼`) to mimic TUI arrows. Avoid SVG icons.
*   `.nc-button`: Primary Action button (e.g., Submit, Save). Bg `--nc-panel-bg`, Border `--nc-border`.
    *   *Hover*: Bg `--nc-accent` (Cyan), Text `--nc-black`.
    *   *Active*: Bg `--nc-warn` (Yellow).
*   **Secondary / Text Actions** (CRITICAL):
    *   **RULE**: All secondary actions in lists, tables, data grids, cards, or chat messages (e.g., Edit, Delete, Copy, Remove) **MUST** use the text-only bracket format.
    *   **NEVER** use solid buttons for these secondary actions. Simplicity is key.
    *   **Format**: `[ACTION]` (e.g., `[EDIT]`, `[DELETE]`, `[COPY]`, `[X]`).
    *   **Style**:
        *   **No border**, **No background** (transparent).
        *   *Hover*: Text color background (White/Yellow), Black text. Inverts colors.
        *   *Padding*: Minimal (e.g., `0 4px`).
    *   **Adherence**: This is a strict requirement. Do not pollute the UI with heavy buttons for minor actions. Keep the TUI aesthetic clean.

### Text & Messaging
*   `.nc-header`: Title block that overlaps the top border of a panel.
*   `.nc-section-title`: Inline title for sections within a panel.
*   `.nc-message`: Chat message bubbles.
    *   `.nc-message--user`: Cyan background, black text.
    *   `.nc-message--assistant`: Blue background, white text.

## Layout Rules

1.  **Flex & Grid**: Use standard Tailwind classes or CSS Grid for layout.
2.  **Spacing**: Use `--nc-gap`, `--nc-pad-sm`, `--nc-pad-md`, `--nc-pad-lg`.
3.  **Borders**:
    *   Panels: `4px double var(--nc-bright-white)`
    *   Inputs/Buttons: `2px solid var(--nc-bright-white)` (or `var(--nc-line)`)
4.  **No Scrollbars**: (Ideally) The main UI should fit the screen. If scrolling is needed, use custom styled scrollbars (defined in global.css).

## Do's and Don'ts

### DO
*   **DO** use `width: 100%` on inputs to prevent overflow.
*   **DO** use strict sharp edges (`border-radius: 0 !important`).
*   **DO** use solid colors.
*   **DO** ensure high contrast (White/Yellow on Blue/Black).
*   **DO** use text-only `[ACTION]` buttons for all secondary interactions (Edit, Delete, Copy).

### DON'T
*   **DON'T** use shadows (box-shadow) or glow effects (unless specifically for "CRT" overlay effects).
*   **DON'T** use transparency or blur (backdrop-filter).
*   **DON'T** use rounded corners.
*   **DON'T** use lowercase for navigation or control labels.
*   **DON'T** use SVG icons or icon libraries (Phosphor, FontAwesome). Use ASCII/Unicode characters if needed.
*   **DON'T** mix modern UI patterns (floating labels, material design ripples) with this theme.
