

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


  // Render Bookmarks
 function renderBookmarks(bookmarks) {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  bookmarkList.innerHTML = "";

  bookmarks.forEach((b, i) => {
    const li = document.createElement("li");

    // Timestamp + Note
    const text = document.createElement("span");
    text.textContent = `${formatTime(b.time)} - ${b.note}`;
    text.style.cursor = "pointer";
    text.onclick = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { type: "JUMP_TO", time: b.time });
      });
    };
    li.appendChild(text);

    // Wrapper for action buttons
    const buttonDiv = document.createElement("div");
    buttonDiv.style.display = "inline-block"; // or "flex" if you prefer


    // ✏️ Edit Button
    const editBtn = document.createElement("img");
    editBtn.src = "icons/pencil.png";
    editBtn.title = "Edit note";
    editBtn.style.marginLeft = "8px";
    editBtn.style.cursor = "pointer";
    editBtn.onclick = () => {
      const newNote = prompt("Edit Note:", b.note);
      if (newNote !== null) {
        bookmarks[i].note = newNote;
        renderBookmarks(bookmarks);
      }
    };
    buttonDiv.appendChild(editBtn);

    // 🗑️ Delete Button
    const delBtn = document.createElement("img");
    delBtn.src = "icons/trash.png";
    delBtn.title = "Delete bookmark";
    delBtn.style.marginLeft = "4px";
    delBtn.style.cursor = "pointer";
    delBtn.onclick = () => {
      bookmarks.splice(i, 1);
      renderBookmarks(bookmarks);
    };
    buttonDiv.appendChild(delBtn);

    li.appendChild(buttonDiv);
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
