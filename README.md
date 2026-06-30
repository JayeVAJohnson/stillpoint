# StillPoint

A calm, organized new tab. Pomodoro timer, to-do list, notepad, habit tracker, and day planner — all offline, no account, no tracking.

> *"At the still point of the turning world."* — a quiet anchor for your day, every time you open a tab.

**[→ Try the live demo](https://JayeVAJohnson.github.io/stillpoint/)**

---

## Choose how you want to use it

There are two ways to run StillPoint. Pick whichever sounds easier — both use the exact same files.

| | Best for | What it does |
|---|---|---|
| **Browser extension** | People who want it on *every* new tab, automatically | Replaces your browser's new tab page |
| **Standalone page** | People who don't want to touch extension settings at all | A regular page you open, bookmark, or set as your homepage |

---

## Option A: Install as a browser extension

Works the same way in any Chromium-based browser — Chrome, Edge, Brave, Arc, Opera, Vivaldi, and Avast Secure Browser. Firefox is a little different (see below) because Firefox doesn't allow permanent unlisted extensions.

### 1. Download the files
Download this repo as a ZIP and unzip it somewhere permanent on your computer (e.g. `~/Documents/stillpoint`). Don't move or delete the folder after installing — the browser keeps pointing at it.

### 2. Chrome, Edge, Brave, Arc, Opera, Vivaldi
1. Open your browser and go to:
   - Chrome / Brave / Arc / Opera / Vivaldi: `chrome://extensions`
   - Edge: `edge://extensions`
2. Turn on **Developer mode** (toggle, usually top-right).
3. Click **Load unpacked**.
4. Select the unzipped `stillpoint` folder.
5. Open a new tab — you're done.

### 3. Avast Secure Browser
Avast Secure Browser is built on Chromium, so it uses the same `chrome://extensions` page as above — but it also ships with an **Extensions Guard** setting that can block new installs.
1. Go to `chrome://extensions` in Avast.
2. If Developer mode won't toggle on, or the install seems blocked: open Avast's **Settings → Privacy & Security → Extensions Guard** and temporarily allow new extensions.
3. Follow the same steps as above: Developer mode on → **Load unpacked** → select the `stillpoint` folder.
4. You can turn Extensions Guard back on afterward; it only checks at install time.

### 4. Firefox
Firefox requires a signed extension from addons.mozilla.org to run *permanently*. For personal use, you can load it temporarily:
1. Go to `about:debugging`.
2. Click **This Firefox → Load Temporary Add-on**.
3. Select the `manifest.json` file inside the unzipped folder.

Note: temporary add-ons are removed when Firefox restarts, so you'll repeat this step each time you reopen the browser. If you want it permanent in Firefox, the standalone option below is the easier path.

---

## Option B: Use it standalone, no extension setup at all

If you'd rather skip developer mode and extension settings entirely, StillPoint works as a plain web page too — same look, same features, same local-only storage.

1. Unzip the folder as in Option A, step 1.
2. Double-click `newtab.html`. It opens in your default browser like any other page.
3. **Bookmark it** so you can get back to it easily, or:
4. **Set it as your homepage** — most browsers have a Settings → "On startup" or "Homepage" option where you can point to a local file. Paste in the file's location (it'll look like `file:///Users/you/Documents/stillpoint/newtab.html` on Mac, or `file:///C:/Users/you/Documents/stillpoint/newtab.html` on Windows).

Your to-dos, notes, habits, and theme are saved locally in that browser, tied to that page, exactly like the extension version — they'll still be there next time you open it. The only difference is it won't *automatically* replace every new tab; you open it the way you'd open a bookmark.

This is also the easiest option if you're not on Chrome/Edge/Brave/Firefox at all, or just don't want to deal with extension permissions.

---

## Features

### ⏱ Pomodoro timer
- Configurable focus / break / long break lengths (Settings → Pomodoro)
- Tracks sessions (1–4), then a long break
- Flashes the tab title when a session ends

### ✅ To-do list
- Add tasks with Enter or the + button
- Click the circle to mark done; click the text to edit inline
- **Import / Export** live as two small buttons (`↑ Import` / `↓ Export`) in the top-right corner of the To-do widget
- **Import:** click it to pick a `.txt` (one task per line) or `.csv` file. Tasks are **added** to your existing list, not replaced
- **Export:** click it, then choose `.txt` or `.csv` from the small menu that appears. Downloads all your tasks, done and not-done
- Exporting and then re-importing the same file round-trips cleanly — done/not-done status is preserved either way
- "Clear done" removes completed tasks

### 📝 Notepad
- Plain text, auto-saves as you type
- Persists across sessions

### 🔥 Habits
- Add habits in Settings → Habits
- See a 7-day dot grid per habit; click any dot to toggle
- Today's dot has an accent ring

### 📅 Day planner
- Two views: **Time blocks** (start → end + label) or an ordered **list** with optional times
- Resets each day (previous days' data is preserved but a new day starts fresh)

---

## Themes & background

Open **⚙ Settings** (top-right) to:
- Pick from 6 built-in themes: Dusk, Midnight, Forest, Slate, Rose, Light
- Upload a personal background image (stored locally in your browser, never sent anywhere)
- Remove the background image to return to the theme colour

---

## Your data

Everything is stored locally in your browser — your machine, nowhere else.
- **Extension version:** uses `chrome.storage.local`. Uninstalling the extension clears all data.
- **Standalone version:** uses your browser's local storage for that page. Clearing your browser's site data for that file will clear it too.

Export your tasks before uninstalling or clearing data if you want to keep them.

---

## License

MIT — see [LICENSE](LICENSE).
