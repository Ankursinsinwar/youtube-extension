// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "SAVE_BOOKMARK") {
//     const { time, note } = request.payload;
//     const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
//     bookmarks.push({ time: time, note: note });
//     localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
//     renderBookmarks(bookmarks);
//     // Update UI if popup is open
//     // const bookmarkList = document.getElementById("bookmarkList");
//     // if (bookmarkList) {
//     //   renderBookmarks(bookmarks);
//     // }
//   }
// });



document.addEventListener("DOMContentLoaded", () => {
  const bookmarkList = document.getElementById("bookmarkList");
  const searchResults = document.getElementById("searchResults");

  // Load bookmarks from localStorage
  const savedBookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  renderBookmarks(savedBookmarks);

  // Save Timestamp Button
  document.getElementById("save").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_TIME" }, (response) => {
        const note = document.getElementById("note").value.trim();
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
        bookmarks.push({ time: response.time, note });
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        renderBookmarks(bookmarks);
        document.getElementById("note").value = ""; // Clear input
      });
    });
  });

  // Search Chapters
  document.getElementById("searchBtn").addEventListener("click", () => {
    const searchTerm = document.getElementById("search").value.toLowerCase();
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_CHAPTERS" }, (res) => {
        const filtered = res.chapters.filter(c =>
          c.text.toLowerCase().includes(searchTerm)
        );
        renderSearchResults(filtered);
      });
    });
  });


  // document.getElementById("summarizeBtn").addEventListener("click", () => {
  //   chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  //     // chrome.tabs.sendMessage(tab.id, { type: "GET_CAPTIONS" }, (response) => {
  //     chrome.tabs.sendMessage(tab.id, { type: "GET_CAPTIONS" }, (response) => {
  //       if (!response?.captions || response.captions.length === 0) {
  //         alert("No captions found.");
  //         return;
  //       }
  
  //       fetch("http://127.0.0.1:5000/summarize", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ captions: response.captions })
  //       })
  //         .then(res => res.json())
  //         .then(summaries => renderSummaries(summaries))
  //         .catch(err => {
  //           console.error("Summarization error:", err);
  //           alert("Failed to summarize topics.");
  //         });
  //     });
  //   });
  // });
  
  // function renderSummaries(summaries) {
  //   const list = document.getElementById("summaryResults");
  //   list.innerHTML = "";
  
  //   summaries.forEach((s) => {
  //     const li = document.createElement("li");
  
  //     const text = document.createElement("span");
  //     text.textContent = `${formatTime(s.start)} - ${s.summary}`;
  //     text.style.cursor = "pointer";
  //     text.onclick = () => {
  //       chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  //         chrome.tabs.sendMessage(tab.id, { type: "JUMP_TO", time: s.start });
  //       });
  //     };
  //     li.appendChild(text);
  
  //     const saveBtn = document.createElement("button");
  //     saveBtn.textContent = "save";
  //     // saveBtn.style.marginLeft = "8px";
  //     saveBtn.onclick = () => {
  //       const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  //       bookmarks.push({ time: s.start, note: s.summary });
  //       localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  //       renderBookmarks(bookmarks);
  //     };
  
  //     li.appendChild(saveBtn);
  //     list.appendChild(li);
  //   });
  // }


  document.getElementById("summarizeBtn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    const videoId = new URLSearchParams(new URL(tab.url).search).get("v");
    if (!videoId) return alert("No video ID found");
  
    try {
      const captionsRes = await fetch("http://127.0.0.1:5000/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId })
      });
  
      const captions = await captionsRes.json();
      if (!captions || captions.length === 0) {
        alert("No captions found for this video.");
        return;
      }
  
      const summarizeRes = await fetch("http://127.0.0.1:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captions })
      });
  
      const summaries = await summarizeRes.json();
      const list = document.getElementById("summaryResults");
      list.innerHTML = "";
  
      summaries.forEach(s => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${formatTime(s.start)}</strong> — ${s.summary}`;
        li.style.cursor = "pointer";
        li.onclick = () => {
          chrome.tabs.sendMessage(tab.id, { type: "JUMP_TO", time: s.start });
        };
  
        const saveBtn = document.createElement("img");
        saveBtn.src = "icons/" + "bookmark" + ".png";
        saveBtn.onclick = () => {
          const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
          bookmarks.push({ time: s.start, note: s.summary });
          localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
          renderBookmarks(bookmarks);
        };
  
        li.appendChild(saveBtn);
        list.appendChild(li);
      });
  
    } catch (err) {
      console.error("Summarize failed:", err);
      alert("Failed to summarize topics.");
    }
  });
  

  

  // Render Bookmarks
  function renderBookmarks(bookmarks) {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    bookmarkList.innerHTML = "";
    bookmarks.forEach((b, i) => {
      const li = document.createElement("li");

      const text = document.createElement("span");
      text.textContent = `${formatTime(b.time)} - ${b.note}`;
      text.style.cursor = "pointer";
      text.onclick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.tabs.sendMessage(tab.id, { type: "JUMP_TO", time: b.time });
        });
      };
      li.appendChild(text);

      // edit button
      const editBtn = document.createElement("img");
      editBtn.src = "icons/" + "pencil" + ".png";
      editBtn.title = "Edit note";
      // editBtn.style.marginLeft = "8px";
      editBtn.onclick = () => {
        const newNote = prompt("Edit Note:", b.note);
        if (newNote !== null) {
          bookmarks[i].note = newNote;
          renderBookmarks(bookmarks);
        }
      };
      li.appendChild(editBtn);

      // Delete Button
      const delBtn = document.createElement("img");
      delBtn.src = "icons/" + "trash" + ".png";
      delBtn.title = "Delete bookmark";
      // delBtn.style.marginLeft = "4px";
      delBtn.onclick = () => {
        bookmarks.splice(i, 1);
        renderBookmarks(bookmarks);
      };
      li.appendChild(delBtn);

      bookmarkList.appendChild(li);
    });
  }

  // Render Search Results
  function renderSearchResults(results) {
    searchResults.innerHTML = "";
    results.forEach((r) => {
      const li = document.createElement("li");

      const text = document.createElement("span");
      text.textContent = `${formatTime(r.time)} - ${r.text}`;
      text.style.cursor = "pointer";
      text.onclick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.tabs.sendMessage(tab.id, { type: "JUMP_TO", time: r.time });
        });
      };
      li.appendChild(text);

      const saveBtn = document.createElement("img");
      saveBtn.src = "icons/" + "bookmark" + ".png";
      saveBtn.title = "Save chapter";
      saveBtn.style.marginLeft = "8px";
      saveBtn.onclick = () => {
        const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
        bookmarks.push({ time: r.time, note: r.text });
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        renderBookmarks(bookmarks);
      };
      li.appendChild(saveBtn);

      searchResults.appendChild(li);
    });
  }

  // Format time in mm:ss
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
});
