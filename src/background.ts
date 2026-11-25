/// <reference types="chrome"/>

import {
  DEFAULT_SETTINGS,
  type Profile,
  type TemplateData,
  type TemplatesMap,
} from "./types/storage";
import { findMatchingTemplate, isDomainExcluded } from "./utils/matching";

interface StorageResult {
  templates?: TemplatesMap;
  autoIncrement?: number;
  excludedDomains?: string[];
  profiles?: Profile[];
  activeProfileId?: string;
  globalFields?: unknown[];
  reviewPromptState?: { installedAt?: number };
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    [
      "templates",
      "autoIncrement",
      "reviewPromptState",
      "profiles",
      "activeProfileId",
      "globalFields",
      "accentColor",
      "excludePasswords",
      "autoFillDelay",
    ],
    (
      result: StorageResult & {
        accentColor?: string;
        excludePasswords?: boolean;
        autoFillDelay?: number;
      },
    ) => {
      const updates: Record<string, unknown> = {};

      if (!result.templates) updates.templates = {};
      if (result.autoIncrement === undefined) updates.autoIncrement = 1;
      if (!result.reviewPromptState?.installedAt) {
        updates.reviewPromptState = { installedAt: Date.now() };
      }
      if (!result.profiles || result.profiles.length === 0) {
        updates.profiles = [
          {
            id: "default",
            name: "Personal",
            fields: Array.isArray(result.globalFields)
              ? result.globalFields
              : [],
          },
        ];
        updates.activeProfileId = "default";
      }
      if (!result.accentColor) {
        updates.accentColor = DEFAULT_SETTINGS.accentColor;
      }
      if (result.excludePasswords === undefined) {
        updates.excludePasswords = DEFAULT_SETTINGS.excludePasswords;
      }
      if (result.autoFillDelay === undefined) {
        updates.autoFillDelay = DEFAULT_SETTINGS.autoFillDelay;
      }

      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    },
  );
});

chrome.runtime.onMessage.addListener(
  (
    message: {
      action: string;
      payload?: { url: string; data?: TemplateData };
    },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message.action === "saveForm" && message.payload) {
      const { url, data } = message.payload;
      chrome.storage.local.get(
        ["templates", "excludedDomains"],
        (result: StorageResult) => {
          if (isDomainExcluded(url, result.excludedDomains)) {
            sendResponse({ success: false, excluded: true });
            return;
          }

          const templates = result.templates || {};
          const existing = templates[url];
          templates[url] = {
            ...existing,
            ...data,
            name: existing?.name || data?.name || url,
            matchMode: existing?.matchMode || data?.matchMode || "exact",
            category: existing?.category || data?.category || "",
            updatedAt: Date.now(),
          };
          chrome.storage.local.set({ templates }, () => {
            sendResponse({ success: true });
          });
        },
      );
      return true;
    }

    if (message.action === "getAutoIncrement") {
      chrome.storage.local.get("autoIncrement", (result: StorageResult) => {
        const currentVal = result.autoIncrement || 1;
        const nextVal = currentVal + 1;
        chrome.storage.local.set({ autoIncrement: nextVal }, () => {
          sendResponse({ value: currentVal });
        });
      });
      return true;
    }

    if (message.action === "getTemplate" && message.payload) {
      const { url } = message.payload;
      chrome.storage.local.get(
        ["templates", "excludedDomains"],
        (result: StorageResult) => {
          if (isDomainExcluded(url, result.excludedDomains)) {
            sendResponse({ template: null, excluded: true });
            return;
          }
          const matched = findMatchingTemplate(result.templates, url);
          sendResponse({ template: matched });
        },
      );
      return true;
    }
  },
);

chrome.commands.onCommand.addListener((command) => {
  if (command === "run_autofill") {
    chrome.storage.local.get("enableShortcut", (res) => {
      if (res.enableShortcut === false) {
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
