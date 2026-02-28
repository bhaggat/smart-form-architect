# SmartForm Architect ⚡

SmartForm Architect is a powerful, modern, and highly customizable Google Chrome extension designed to streamline form filling, save recurring form structures, and boost your automated productivity.

## ✨ Key Features & Functionalities

### 1. 🎯 Record Mode (Form Auto-Save)

- **Automatic Capture**: Easily toggle "Record Mode" to implicitly observe and save form structures and inputs as you submit them on any website.
- **Manual Save**: Use the "Save Current" action to automatically detect and store all form fields currently visible on the webpage without needing to submit.

### 2. ⚡ Intelligent Autofill Suggestions

- **Per-Field Icons**: Unobtrusive, inline icons that pop up next to individual input fields offering smart suggestions based on your saved templates.
- **Per-Page Banner**: A global banner option that can autofill the entire form on the page with one click.
- **Empty Values Skipped**: The extension is intelligent enough to skip saving empty input values, maintaining the integrity of your templates.
- **Configurable Suggestions**: Completely toggle per-field or per-page suggestions on or off from the main extension interface.

### 3. ⌨️ Keyboard Shortcuts

- Execute global form autofill instantly using customizable keyboard shortcuts.
  - **Default**: `Alt+Shift+A` (Windows/Linux) or `Command+Shift+A` (Mac).
- Can be easily enabled/disabled via the extension popup to prevent conflicts with other applications.

### 4. 🗂️ Advanced Master Dashboard & Templates Manager

A comprehensive web view dashboard to seamlessly manage all your captured forms.

- **View Templates**: Browse forms saved per specific URL.
- **Recent Templates**: The extension window shows quick links and field counts for the most recently updated templates.
- **Edit & Modify Data**: Add, delete, or refine the captured inputs and default values for each form directly inside the dashboard.
- **Global Fields**: Define universal fields (like your Name, Main Email, Phone Number) that can be accessed and autofilled everywhere across different web domains.

### 5. 📁 Categories & Organization

- Keep your global fields and templates structured by assigning them to Categories.
- Includes List & Grid views within the Categories interface for an intuitive organizational experience.
- Easily filter, search, view, edit, or merge different fields.

### 6. 🎨 Premium Modern UI Experience

- Built using React + TypeScript for extreme responsiveness.
- Features a beautiful glassmorphism design language with sleek animations, accent gradients, and rich visuals.
- Intuitive, user-friendly toggles and configuration pages embedded directly into the Chrome Extension popup.

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Chrome Extensions API (Manifest V3)
- Lucide React (Icons)
- Vanilla CSS (for tailored styling & performance)

## 🚀 Installation & Developer Setup

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Getting Started

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd smart-form-architect
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Run Development Server:**

   ```bash
   npm run dev
   ```

   _(This starts Vite for UI development with Hot-Module Replacement)._

4. **Build for Production / Extension Formatting:**
   ```bash
   npm run build
   ```
   This will run the TypeScript compiler and Vite builder, generating the output into the `dist/` directory, complete with the `manifest.json`.

### Loading the Extension into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top right corner.
3. Click **"Load unpacked"** in the top left.
4. Select the `dist/` folder generated in the previous step.
5. The _SmartForm Architect_ extension should now appear in your browser. Pin it for quick access!

---

_Built for productivity enthusiasts who hate repeating themselves._
