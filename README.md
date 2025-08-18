Bookmark Alchemist: Your Personal Bookmark Search Engine

Bookmark Alchemist is a browser extension that transforms your personal bookmark collection into a powerful, private search engine. It allows you to manage your bookmarks with folders and tags, and provides instant search suggestions directly from your browser's address bar. All your data is stored locally, ensuring complete privacy.

Features

🔎 Omnibox Integration: Type bm + space in your address bar to instantly search your bookmarks.

📁 Folder & Tag Organization: Group your bookmarks into folders and add tags for powerful filtering.

⚡️ Fast & Local: All data is stored in your browser's local storage. No external servers, no tracking.

📦 Import/Export: Easily import and export your collection as JSON or standard HTML bookmark files.

⌨️ Command Palette: Use ⌘K or Ctrl+K to quickly access all actions.

Local Development Setup

To run this extension locally for development, you will need Node.js installed.

1. Clone the Repositorygit clone https://github.com/your-username/bookmark-alchemist.git
cd bookmark-alchemist

2. Install DependenciesThis project uses tailwindcss for styling and babel to compile React JSX.npm install

3. Build Static AssetsBefore loading the extension, you need to compile the CSS and JavaScript.

# Compile Tailwind CSS
npx @tailwindcss/cli -i ./input.css -o ./output.css

# Compile React JSX
npx babel app.js --out-file app.compiled.js

4. Load the Extension in Your Browser

Open your browser (e.g., Chrome, Edge, Brave).Navigate to the extensions page (e.g., chrome://extensions).

Enable Developer mode (usually a toggle in the top-right corner).

Click Load unpacked.

Select the bookmark-alchemist folder.

The extension should now be active and ready for testing.

How to Use

To Search: Open a new tab, type bm followed by a space in the address bar, and start typing your query.

To Manage Bookmarks: Click the Bookmark Alchemist icon in your browser's toolbar to open the main management interface.