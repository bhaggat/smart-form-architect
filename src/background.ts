/// <reference types="chrome"/>

interface StorageResult {
  templates?: Record<string, unknown>;
  autoIncrement?: number;
}

chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage
  chrome.storage.local.get(
    ["templates", "autoIncrement"],
    (result: StorageResult) => {
      if (!result.templates) {
        chrome.storage.local.set({ templates: {} });
      }
      if (result.autoIncrement === undefined) {
        chrome.storage.local.set({ autoIncrement: 1 });
      }
    },
  );
});

chrome.runtime.onMessage.addListener(
  (
    message: { action: string; payload?: { url: string; data?: unknown } },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    console.log(
      `[SmartForm] [Background] Received action: ${message.action}`,
      message.payload,
    );
    if (message.action === "saveForm" && message.payload) {
      const { url, data } = message.payload;
      console.log(`[SmartForm] [Background] Saving form for URL: ${url}`, data);
      chrome.storage.local.get("templates", (result: StorageResult) => {
        const templates = result.templates || {};
        templates[url] = data;
        chrome.storage.local.set({ templates }, () => {
          console.log(`[SmartForm] [Background] Form saved successfully.`);
          sendResponse({ success: true });
        });
      });
      return true; // Keep channel open for async response
    }

    if (message.action === "getAutoIncrement") {
      chrome.storage.local.get("autoIncrement", (result: StorageResult) => {
        const currentVal = result.autoIncrement || 1;
        const nextVal = currentVal + 1;
        chrome.storage.local.set({ autoIncrement: nextVal }, () => {
          sendResponse({ value: currentVal });
        });
      });
      return true; // Keep channel open
    }

    if (message.action === "getTemplate" && message.payload) {
      const { url } = message.payload;
      chrome.storage.local.get("templates", (result: StorageResult) => {
        const templates = result.templates || {};
        console.log(
          `[SmartForm] [Background] getTemplate result for ${url}:`,
          templates[url] ? "Found" : "Not Found",
        );
        sendResponse({ template: templates[url] || null });
      });
      return true;
    }
  },
);

chrome.commands.onCommand.addListener((command) => {
  console.log(`[SmartForm] [Background] Received command: ${command}`);
  if (command === "run_autofill") {
    chrome.storage.local.get("enableShortcut", (res) => {
      if (res.enableShortcut === false) {
        console.log("[SmartForm] [Background] Shortcut disabled in settings.");
        return;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "runAutofill" });
        }
      });
    });
  }
});
