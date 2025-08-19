# Bookmark Alchemist

Bookmark Alchemist is a browser extension that transforms your personal bookmark collection into a powerful, private search engine. It allows you to manage your bookmarks with folders and tags, and provides instant search suggestions directly from your browser's address bar. All your data is stored locally, ensuring complete privacy.

# Features

- 🔎 Omnibox Integration: Type `bm` + space in your address bar to instantly search your bookmarks.
- 📁 Folder & Tag Organization: Group your bookmarks into folders and add tags for powerful filtering.
- ⚡️ Fast & Local: All data is stored in your browser's local storage. No external servers, no tracking.
- 📦 Import/Export: Easily import and export your collection as JSON or standard HTML bookmark files.
- ⌨️ Command Palette: Use ⌘K or Ctrl+K to quickly access all actions.

# How to Use

To Search: Open a new tab, type bm followed by a space in the address bar, and start typing your query.

To Manage Bookmarks: Click the Bookmark Alchemist icon in your browser's toolbar to open the main management interface.

# Development Setup

To run this extension locally for development, you will need Node.js installed.

1. Clone the Repository: `git clone https://github.com/Gyyyn/BookmarkAlchemist.git`

2. Install Dependencies: `npm install`

3. Build Static Assets:

## Compile Tailwind CSS
`npx @tailwindcss/cli -i ./input.css -o ./output.css`

## Compile React JSX
`npx babel app.js --out-file app.compiled.js`

4. Load the Extension in Your Browser (Make sure you're in the `firefox` branch if you're loading in a Gecko-based browser.

# Support and other projects

You can find a web-based version of the extension on [my tools repository](https://gyyyn.github.io), alongside other tools.

You can help support the development of this and other tools using [ko-fi](https://ko-fi.com/gyntenzyme)