const status = document.getElementById("status");
document.getElementById("page-bounce").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active page found.");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["page-bounce.js"] });
    status.textContent = "The Bible is on this page. Click it to read; use × to close.";
  } catch {
    status.textContent = "This page blocks extensions. Try a normal website or open the desktop Bible.";
  }
});
