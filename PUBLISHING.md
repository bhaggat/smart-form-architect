# Chrome Web Store Publishing Details

This document contains all the text snippets, required assets, and privacy justifications you need to copy-paste when publishing **SmartForm Architect** to the Chrome Web Store. Having these details pre-written saves time and ensures consistency.

---

## 1. Store Listing Details

These are the public-facing details users will see when they visit your extension's Chrome Web Store page.

- **Name (max 45 characters):**
  `SmartForm Architect`

- **Summary (max 132 characters):**
  `An intelligent form-filling automation tool to capture structural templates and autofill recurring data instantly.`

- **Description (up to 16,000 characters):**
  _(You can copy and paste the `README.md` contents here, or use this refined sales-copy version 👇)_

  > **SmartForm Architect ⚡**
  >
  > Stop wasting time filling out the same repetitive fields across different websites! SmartForm Architect is a powerful, modern, and highly customizable Google Chrome extension designed to streamline your form-filling experience, save recurring form structures, and boost your automated productivity.
  >
  > **✨ Key Features:**
  >
  > - **Intelligent Record Mode**: Toggle it on to silently observe and save form structures automatically as you submit them. No extra clicks needed.
  > - **Smart Autofill**: Enjoy unobtrusive, inline ghost icons that pop up next to individual fields to offer smart suggestions based on your saved templates.
  > - **Per-Page Autofill**: Fill out the entire page with a single click using the global banner option or customizable keyboard shortcuts (Default: Alt+Shift+A).
  > - **Master Dashboard**: Access a comprehensive web dashboard to seamlessly manage all your captured forms, global variables, and specific website templates.
  > - **Premium Design**: Built for productivity enthusiasts, featuring a beautiful glassmorphism design language with sleek animations and dark mode aesthetics.
  >
  > Download SmartForm Architect today and put an end to repetitive data entry!

- **Category:** `Productivity`

- **Language:** `English (United States)` _(Or your preferred primary language)_

---

## 2. Graphic Assets Checklist

Before submitting, ensure you have these exact visual files ready to upload:

- [x] **Store Icon:** `128x128 pixels` (PNG). _Generated as `icon128.png` in the `public/` directory._
- [ ] **Promotional Screenshots:** 1 to 5 screenshots sized at `1280x800` or `640x400` pixels (PNG/JPEG).
  - _Tip: Take a screenshot of your main "Dashboard" page and one of the "Ghost Icon" appearing next to an input field on a webpage._
- [ ] **Promotional Marquee (Optional but highly recommended):** `1400x560` pixels banner image to be featured on the store homepage.

---

## 3. Privacy & Justifications

The Chrome Web Store review process is strict about data handling. Since SmartForm Architect only uses local storage, use the following answers to expedite your review:

- **Single Purpose Description:**

  > "SmartForm Architect is designed strictly to observe, save, and manage reusable form architectures and data locally to rapidly autofill forms in the user's browser."

- **Permission Justifications:**
  You requested 3 permissions in your `manifest.json`. Justify them in the store as follows:
  - **`storage`**: "Required to save user-defined form templates, structural field data, and UI preference settings locally on the user's browser via the chrome.storage.local API."
  - **`activeTab`**: "Required to safely identify the current URL, analyze visible input fields, and inject necessary autofill ghost icons dynamically inside forms without needing persistent background access to all tabs."
  - **`scripting`**: "Required to execute the form-detection and autofill algorithm securely within the context of the user's currently focused webpage when triggered via UI actions or shortcuts."

- **Data Usage Policy:**
  - Do you sell data to third parties? **Answer: No.**
  - Do you use data for purposes unrelated to the main function? **Answer: No.**
  - Do you use data for credit/lending checks? **Answer: No.**

- **Privacy Policy URL:**
  Paste the public URL to your hosted `PRIVACY_POLICY.md` file. _(If you haven't hosted it yet, you can use a free [GitHub Gist](https://gist.github.com) or a Notion public page)._

---

## 4. Final Submission Steps

1. Run `npm run pack` in your terminal to generate the fully built ZIP file.
2. Locate the `smartform-architect-release.zip` file in your root folder.
3. Open the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/) > "New Item".
4. Upload the ZIP.
5. Fill in the Details and Privacy sections using the exact text provided above.
6. Upload your screenshots and 128x128 icon.
7. Click **"Submit for Review"**.
