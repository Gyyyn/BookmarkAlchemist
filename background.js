// Function to get bookmarks from storage
async function getBookmarks() {
  const data = await chrome.storage.local.get('bookmark_manager_v1');
  return data.bookmark_manager_v1?.bookmarks || [];
}

// This helper function is needed to copy text from a background script.
function writeToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.textContent = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Listen for input in the omnibox
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const bookmarks = await getBookmarks();
  const query = text.toLowerCase().trim();

  if (!query) {
    // Clear suggestions if there is no query
    chrome.omnibox.setDefaultSuggestion({
      description: 'Search your bookmarks...'
    });
    suggest([]);
    return;
  }

  const suggestions = bookmarks
    .filter(bm => 
      bm.title.toLowerCase().includes(query) || 
      bm.url.toLowerCase().includes(query) || 
      (bm.tags && bm.tags.some(t => t.toLowerCase().includes(query)))
    )
    .map(bm => {
      return {
        content: bm.url,
        description: `<match>${bm.title}</match> - <url>${bm.url.replace(/^(https?:\/\/)?(www\.)?/, '')}</url>`
      };
    });

  // Fix for Vivaldi.
  // It sets the very first item in the dropdown as the default action.
  if (suggestions.length > 0) {
    // If we have results, tell the browser the default action is to navigate.
    chrome.omnibox.setDefaultSuggestion({
      description: `Go to: ${suggestions[0].description}`
    });
  } else {
    // If no results, suggest a web search instead.
    chrome.omnibox.setDefaultSuggestion({
      description: `Search the web for: <match>${text}</match>`
    });
  }

  suggest(suggestions);
});

// Handle what happens when the user presses 'Enter'
chrome.omnibox.onInputEntered.addListener(async (url, disposition) => {
  const settings = (await chrome.storage.local.get('settings'))?.settings || {};
  const omniboxAction = settings.omniboxAction || 'open';

  // The 'url' is the 'content' property of the suggestion you selected.
  // The 'disposition' tells us how the user wants to open it.

  // First, check if the input is a valid URL from your bookmarks.
  // If not, it's just text the user typed, so we can fall back to a regular search.
  if (!url.startsWith('http') && !url.startsWith('javascript:')) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    chrome.tabs.create({ url: searchUrl });
    return;
  }

  if (omniboxAction === 'copy') {
    writeToClipboard(url);
    return;
  }

  // If it IS a valid URL from your bookmarks, handle the navigation.
  switch (disposition) {
    default:
    case "currentTab":
      // Update the current tab to the selected bookmark's URL
      chrome.tabs.update({ url });
      break;
    case "newForegroundTab":
      // Create a new tab with the URL and switch to it
      chrome.tabs.create({ url, active: true });
      break;
    case "newBackgroundTab":
      // Create a new tab with the URL but stay on the current page
      chrome.tabs.create({ url, active: false });
      break;
  }
});

let creating; // A global promise to avoid race conditions

// Function to create and manage the offscreen document
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_PARSER'],
      justification: 'Needed to handle file input operations.',
    });
    await creating;
    creating = null;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === 'open-file-picker') {
    await setupOffscreenDocument('import.html');
    // Send a message to the offscreen document to open the file picker
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'open-file-picker',
      accept: msg.accept
    });
  } else if (msg.type === 'file-content') {
    // When we get the file content, forward it to the active tab (the popup)
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'file-imported',
        content: msg.content
      });
    }
    // Close the offscreen document after we're done
    chrome.offscreen.closeDocument();
  }
  return true;
});