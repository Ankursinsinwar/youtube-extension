// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === "complete" && tab.url.includes("youtube.com/watch")) {
//       chrome.scripting.executeScript({
//         target: { tabId: tabId },
//         files: ["content.js"]
//       });
//     }
//   });


// background.js

const API_KEY = "AIzaSyAtIVSisacM58w7oPuAfziZPtXW34c2ZUs"; // Replace with your actual API key

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_CAPTIONS_API") {
    const videoId = request.videoId;

    // 1. Get the list of caption tracks for the video
    fetch(`https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${API_KEY}`)
      .then(response => response.json())
      .then(data => {
        const englishCaptionTrack = data.items?.find(track => track.snippet.language === 'en');

        if (englishCaptionTrack) {
          const trackId = englishCaptionTrack.id;
          // 2. Download the caption track (in JSON format for easier processing)
          return fetch(`https://www.googleapis.com/youtube/v3/captions/${trackId}?tfmt=json&key=${API_KEY}`);
        } else if (data.items?.length > 0) {
          // Fallback to the first available track if English is not found
          const firstTrackId = data.items[0].id;
          console.warn("English captions not found. Fetching the first available track.");
          return fetch(`https://www.googleapis.com/youtube/v3/captions/${firstTrackId}?tfmt=json&key=${API_KEY}`);
        } else {
          throw new Error("No caption tracks found for this video.");
        }
      })
      .then(response => response.json())
      .then(captionData => {
        // Process the JSON caption data into the format your content script expects
        const captions = captionData.events
          ?.filter(e => e.tStartMs !== undefined && e.dDurationMs !== undefined && e.segs?.length > 0)
          ?.map(e => ({
            start: e.tStartMs / 1000,
            text: e.segs.map(s => s.utf8).join(" ")
          })) || [];
        //   sendResponse({ captions });
        // })
        // .catch(error => {
        //   console.error("Error fetching captions:", error);
        //   sendResponse({ error: error.message || "Failed to fetch captions." });
        // });
        chrome.tabs.sendMessage(sender.tab.id, { type: "FETCH_CAPTIONS_API_RESULT", captions: captions });
      })
      .catch(error => {
        console.error("Error fetching captions in background:", error);
        chrome.tabs.sendMessage(sender.tab.id, { type: "FETCH_CAPTIONS_API_ERROR", error: error.message });
      });

    return true; // Keep the response channel open for the async operation
  }
});

// Optional: Listen for tab updates to inject content script

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("youtube.com/watch")) {
    const videoId = new URLSearchParams(new URL(tab.url).search).get("v");

    // chrome.tabs.sendMessage(tabId, {
    //   type: "NEW",
    //   videoId: videoId
    // });
  }
});
