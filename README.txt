# SANJID — Hair Strength Journey

A mobile-first personal 180-day hair routine tracker.

## Files
- `index.html` — structure/UI
- `style.css` — mobile-first design
- `script.js` — checklist, calendar, photos, local progress data and chart

## How to use
1. Put all 3 files in the same folder.
2. Open `index.html` in a browser.
3. Choose your journey start date.
4. Every day tick the missions.
5. Save the day.
6. Add a progress photo and a note.
7. Tap any calendar day to inspect its record.

## Important about the "AI"
This version includes an honest **local AI-style demo review**. It does NOT send photos to an actual AI model and does not pretend that a local browser heuristic is medical/vision AI.

For real photo AI, connect `script.js` to a secure backend that calls a vision model. Never put a private API key directly in the browser.

## Data
The current version stores checklist data, notes, AI review and photos in the browser's `localStorage`. Clearing browser site data can erase it. For a production version, use IndexedDB/cloud storage and add export/backup.
