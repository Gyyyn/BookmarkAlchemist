// Function to get bookmarks from storage
async function getBookmarks() {
  const data = await chrome.storage.local.get('bookmark_manager_v1');
  return data.bookmark_manager_v1?.bookmarks || [];
}

// Listen for input in the omnibox
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const bookmarks = await getBookmarks();
  const query = text.toLowerCase().trim();
  
  if (!query) {
    suggest([]);
    return;
  }

  const suggestions = bookmarks
    .filter(bm => 
      bm.title.toLowerCase().includes(query) || 
      bm.url.toLowerCase().includes(query) || 
      bm.tags.some(t => t.toLowerCase().includes(query))
    )
    .map(bm => {
      // The browser needs a specific format for suggestions
      return {
        content: bm.url, // This is what will be navigated to on 'Enter'
        description: `<match>${bm.title}</match> - <url>${bm.url}</url>`
      };
    });
    
  suggest(suggestions);
});

// Handle what happens when the user presses 'Enter'
chrome.omnibox.onInputEntered.addListener((url) => {
  // If the user selected a suggestion, 'url' will be the bookmark's URL.
  // If they just typed text, it will be that text.
  if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('javascript:')) {
    chrome.tabs.update({ url: url });
  }
});
