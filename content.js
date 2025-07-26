let currentVideo = "";
let youtubeLeftControls, youtubePlayer;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const video = document.querySelector("video");

  if (request.type === "GET_TIME") {
    if (video) {
      sendResponse({ time: Math.floor(video.currentTime) });
    } else {
      sendResponse({ time: 0 });
    }
  }

  if (request.type === "JUMP_TO") {
    if (video) {
      video.currentTime = request.time;
    }
  }

  if (request.type === "GET_CHAPTERS") {
    const chapters = [];
    const seen = new Set();
    const chapterNodes = document.querySelectorAll("ytd-macro-markers-list-item-renderer");

    chapterNodes.forEach((node) => {
      const timeText = node.querySelector("#time")?.textContent?.trim();
      const title = node.querySelector("h4[title]")?.textContent?.trim();

      if (timeText && title) {
        const parts = timeText.split(":").map(Number);
        const time = parts.length === 2
          ? parts[0] * 60 + parts[1]
          : parts[0] * 3600 + parts[1] * 60 + parts[2];

        const uniqueKey = `${time}-${title.toLowerCase()}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          chapters.push({ time, text: title });
        }
      }
    });

    sendResponse({ chapters });
    return true;
  }

  if (request.type === "NEW") {
    currentVideo = request.videoId;
    newVideoLoaded();
  }
});

// Inject bookmark button into YouTube player
const newVideoLoaded = () => {
  const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
  youtubeLeftControls = document.querySelector(".ytp-left-controls");
  youtubePlayer = document.querySelector("video");

  if (!bookmarkBtnExists && youtubeLeftControls && youtubePlayer) {
    const bookmarkBtn = document.createElement("img");
    bookmarkBtn.src = chrome.runtime.getURL("icons/bookmark.png");
    bookmarkBtn.className = "ytp-button bookmark-btn";
    bookmarkBtn.title = "Click to bookmark current timestamp";

    youtubeLeftControls.appendChild(bookmarkBtn);
    bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
  }
};


const addNewBookmarkEventHandler = () => {
  const currentTime = Math.floor(youtubePlayer.currentTime);
  const note = prompt("Enter a note for this bookmark:");
  alert(note);

  if (note !== null) {
    
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    alert(bookmarks)
    bookmarks.push({ time: currentTime, note });
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    alert(localStorage)

    alert("✅ Bookmark saved!");
  }
};
