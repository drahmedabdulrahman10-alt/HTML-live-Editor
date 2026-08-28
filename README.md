# HTML Live Editor

> A Word-like visual WYSIWYG editor for HTML files. Upload any `.html` document, edit in-place visually while strictly preserving original styles, `<style>` blocks, and fonts, and export clean, self-contained HTML files.

![HTML Live Editor](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80)

## Features

- 📝 **Word-like WYSIWYG Editing**: Click into any paragraph, heading, list, or table cell and format with ease.
- 🎨 **Style & Structure Fidelity**: Preserves embedded `<style>` blocks, external fonts, classes, and inline styles without stripping or altering original styling.
- 🖼️ **Interactive Image Controls**: Upload images directly from your device (stored locally as Base64/data URIs) or provide image URLs. Interactive corner/edge resize handles with Shift-key aspect-ratio lock and drag-and-drop repositioning.
- 📊 **Table & Block Tools**: Insert structured tables with zebra striping and headers, callout alert boxes, multi-column grid layouts, and styled action buttons.
- 🎯 **Contextual Element Actions**: Click any element on canvas to access instant actions: Delete, Duplicate, Move Up/Down, Style Inspector, and Raw HTML snippet editor.
- 💾 **Local Persistence (Zero-Backend)**: Automatic debounced saving to `IndexedDB` with `localStorage` fallback. No server, no account, and 100% offline-ready.
- 📂 **Document Library**: Store multiple documents locally, switch between them instantly, or choose from pre-built templates (Executive Report, Newsletter, Resume, Invoice, Blank).
- 🔄 **View Modes & Split Screen**:
  - **Page Mode**: Word / Google Docs style A4 / Letter format with zoom controls.
  - **Web Mode**: Responsive preview with Desktop (1200px), Tablet (768px), and Mobile (375px) presets.
  - **Split Mode**: Bidirectional live HTML source code editor side-by-side with visual preview.
- 🔍 **Search & Replace**: In-document Find & Replace with match case and Replace All.
- 📥 **Export Options**: Download clean `.html`, copy clean markup to clipboard, or trigger print/PDF generation.

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- npm or pnpm or yarn

### Installation & Development

```bash
# 1. Clone or extract the project repository
cd html-live-editor

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Deploy to Vercel (One-Click Static Deploy)

This application is built as a fully static, client-side Single Page Application (SPA). It requires zero configuration, no server, and no database.

### Deploying via Vercel CLI
```bash
npx vercel
```

### Deploying via Vercel Dashboard
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep default settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| **Bold** | `Ctrl + B` (or `Cmd + B`) |
| **Italic** | `Ctrl + I` (or `Cmd + I`) |
| **Underline** | `Ctrl + U` (or `Cmd + U`) |
| **Undo** | `Ctrl + Z` (or `Cmd + Z`) |
| **Redo** | `Ctrl + Y` or `Ctrl + Shift + Z` |
| **Save / Export HTML** | `Ctrl + S` (or `Cmd + S`) |
| **Find & Replace** | `Ctrl + F` (or `Cmd + F`) |
| **Print / PDF** | `Ctrl + P` (or `Cmd + P`) |
| **Delete Element** | `Backspace` or `Delete` on selected node |
| **Lock Aspect Ratio** | Hold `Shift` while dragging image resize handle |

---

## Offline & Privacy Architecture

- **Zero Cloud Storage**: All HTML files, images, and revisions reside in the user's browser via IndexedDB.
- **No External Analytics**: No tracking or data collection scripts.
- **Offline First**: All core WYSIWYG editor engines and UI controls operate entirely client-side without internet connectivity.
