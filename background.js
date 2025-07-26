chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("youtube.com/watch")) {
    const videoId = new URLSearchParams(new URL(tab.url).search).get("v");
  }
});
