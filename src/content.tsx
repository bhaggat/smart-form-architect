/// <reference types="chrome"/>
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Sparkles } from "lucide-react";
import {
  DEFAULT_ACCENT_COLOR,
  type FormField,
  type Profile,
  type TemplateData,
  type TemplatesMap,
} from "./types/storage";
import { parseDynamicTags } from "./utils/tags";
import {
  findMatchingTemplate,
  isDomainExcluded,
  resolveProfilesFromStorage,
} from "./utils/matching";

type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function scoreMatch(el: FormElement, savedField: FormField): number {
  let score = 0;

  const elId = (el.id || "").toLowerCase();
  const elName = (el.name || "").toLowerCase();
  const elPlaceholder =
    "placeholder" in el
      ? ((el as HTMLInputElement).placeholder || "").toLowerCase()
      : "";
  const elAriaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
  const elTitle = (el.getAttribute("title") || "").toLowerCase();
  const elAutocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();
  const elTestId = (
    el.getAttribute("data-testid") ||
    el.getAttribute("data-cy") ||
    ""
  ).toLowerCase();

  const sfId = (savedField.id || "").toLowerCase();
  const sfName = (savedField.name || "").toLowerCase();
  const sfPlaceholder = (savedField.placeholder || "").toLowerCase();

  if (elId && sfId && elId === sfId) score += 5;
  if (elName && sfName && elName === sfName) score += 5;

  if (elId && sfName && elId.includes(sfName)) score += 2;
  if (elName && sfName && elName.includes(sfName)) score += 2;

  if (elPlaceholder && sfPlaceholder && elPlaceholder === sfPlaceholder)
    score += 3;
  else if (elPlaceholder && sfName && elPlaceholder.includes(sfName))
    score += 2;

  if (elAriaLabel && sfName && elAriaLabel.includes(sfName)) score += 3;
  if (elTitle && sfName && elTitle.includes(sfName)) score += 2;
  if (elAutocomplete && sfName && elAutocomplete.includes(sfName)) score += 3;
  if (elTestId && sfName && elTestId.includes(sfName)) score += 2;

  if (el.labels && el.labels.length > 0) {
    const labelText = Array.from(el.labels)
      .map((l) => l.innerText)
      .join(" ")
      .toLowerCase();
    if (labelText && sfName && labelText.includes(sfName)) {
      score += 4;
    }
  } else {
    const nearbyLabel = el.parentElement
      ?.querySelector("label")
      ?.innerText.toLowerCase();
    if (nearbyLabel && sfName && nearbyLabel.includes(sfName)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Uses native prototype setters so React, Vue, and Angular controlled inputs
 * reliably detect programmatic value changes.
 */
function setNativeValue(el: FormElement, value: string): void {
  if (el instanceof HTMLSelectElement) {
    const lowerVal = value.toLowerCase();
    const matchingOption = Array.from(el.options).find(
      (opt) =>
        opt.value.toLowerCase() === lowerVal ||
        opt.text.trim().toLowerCase() === lowerVal,
    );
    const targetVal = matchingOption ? matchingOption.value : value;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    if (setter) setter.call(el, targetVal);
    else el.value = targetVal;
    return;
  }

  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

const getAutoIncrementFromBg = (): Promise<number> =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "getAutoIncrement" },
      (res: { value?: number } | undefined) => resolve(res?.value ?? 1),
    );
  });

const extractFields = (
  container: HTMLElement | Document | HTMLFormElement,
  excludePasswords = true,
): FormField[] => {
  const inputs = container.querySelectorAll<FormElement>(
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), textarea, select",
  );

  const fields: FormField[] = [];
  inputs.forEach((input) => {
    if (excludePasswords && input.type === "password") return;

    let val = input.value;

    if (input.type === "checkbox" || input.type === "radio") {
      const checked = (input as HTMLInputElement).checked;
      if (!checked) return;
      val = val || "true";
    } else {
      if (!val || val.trim() === "") return;
    }

    fields.push({
      id: input.id || "",
      name: input.name || "",
      placeholder:
        "placeholder" in input ? (input as HTMLInputElement).placeholder : "",
      type: input.type || "text",
      value: val,
    });
  });
  return fields;
};

const VERSION = "1.2.0";
console.log(`[SmartForm] Initializing content script. Version: ${VERSION}`);

const GhostOverlay = () => {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [globalFields, setGlobalFields] = useState<FormField[]>([]);
  const [recordMode, setRecordMode] = useState(false);
  const [enablePerField, setEnablePerField] = useState(true);
  const [enablePerPage, setEnablePerPage] = useState(false);
  const [enableShortcut, setEnableShortcut] = useState(true);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [autoFillOnLoad, setAutoFillOnLoad] = useState(false);
  const [autoFillDelay, setAutoFillDelay] = useState(800);
  const [skipFilledFields, setSkipFilledFields] = useState(false);
  const [excludePasswords, setExcludePasswords] = useState(true);
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [customShortcut, setCustomShortcut] = useState("Alt+Shift+A");
  const [mutationTicker, setMutationTicker] = useState(0);

  const currentUrl = window.location.href;
  const isExcluded = useMemo(
    () => isDomainExcluded(currentUrl, excludedDomains),
    [currentUrl, excludedDomains],
  );

  const applyFieldValue = useCallback(
    async (input: FormElement, field: FormField) => {
      if (skipFilledFields) {
        if (input.type === "checkbox" || input.type === "radio") {
          if ((input as HTMLInputElement).checked) return;
        } else if (input.value && input.value.trim() !== "") {
          return;
        }
      }

      const processedVal = await parseDynamicTags(
        field.value,
        getAutoIncrementFromBg,
      );

      if (input.type === "checkbox" || input.type === "radio") {
        const lowerVal = processedVal.toLowerCase();
        (input as HTMLInputElement).checked =
          processedVal === input.value ||
          ["true", "on", "checked"].includes(lowerVal);
      } else {
        setNativeValue(input, processedVal);
      }

      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      const colorForPulse = accentColor || DEFAULT_ACCENT_COLOR;
      input.animate(
        [
          { boxShadow: `0 0 0 0 ${colorForPulse}00` },
          { boxShadow: `0 0 0 4px ${colorForPulse}66` },
          { boxShadow: `0 0 0 0 ${colorForPulse}00` },
        ],
        { duration: 600 },
      );
    },
    [accentColor, skipFilledFields],
  );

  const handleAutofill = useCallback(
    async (targetEl: HTMLElement) => {
      if (isExcluded) return;
      const container = targetEl.closest("form") || document;
      if (!template && globalFields.length === 0) return;

      const inputs = container.querySelectorAll<FormElement>(
        "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select",
      );

      const allFields = [...(template?.fields || []), ...globalFields];

      for (const input of inputs) {
        if (excludePasswords && input.type === "password") continue;

        let bestMatch: FormField | null = null;
        let highestScore = 0;
        allFields.forEach((f) => {
          const s = scoreMatch(input, f);
          if (s > highestScore) {
            highestScore = s;
            bestMatch = f;
          }
        });

        if (highestScore >= 3 && bestMatch) {
          await applyFieldValue(input, bestMatch);
        }
      }
    },
    [template, globalFields, isExcluded, excludePasswords, applyFieldValue],
  );

  // Auto-fill on load
  useEffect(() => {
    if (isExcluded) return;
    if (autoFillOnLoad && (template || globalFields.length > 0)) {
      const timer = setTimeout(() => {
        handleAutofill(document.body);
      }, autoFillDelay);
      return () => clearTimeout(timer);
    }
  }, [
    autoFillOnLoad,
    autoFillDelay,
    template,
    globalFields,
    handleAutofill,
    isExcluded,
  ]);

  // Support custom shortcut via keydown (respecting enableShortcut)
  useEffect(() => {
    if (!enableShortcut || isExcluded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const modifiers = [];
      if (e.ctrlKey) modifiers.push("Ctrl");
      if (e.altKey) modifiers.push("Alt");
      if (e.shiftKey) modifiers.push("Shift");
      if (e.metaKey) modifiers.push("Meta");

      const key = e.key === " " ? "Space" : e.key.toUpperCase();
      const combo = [...modifiers, key].join("+");

      if (combo === customShortcut) {
        e.preventDefault();
        handleAutofill(document.body);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customShortcut, enableShortcut, isExcluded, handleAutofill]);

  // MutationObserver + resize listener for accurate icon positioning
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const bump = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setMutationTicker((t) => t + 1);
      }, 350);
    };

    const observer = new MutationObserver(bump);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", bump);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", bump);
      clearTimeout(timeout);
    };
  }, []);

  const highMatchElements = useMemo(() => {
    if (isExcluded) return [];

    const inputs = document.querySelectorAll<FormElement>(
      "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select",
    );

    const matches: { el: FormElement; field: FormField }[] = [];
    const allFields = [...(template?.fields || []), ...globalFields];

    if (allFields.length === 0) return matches;

    inputs.forEach((input) => {
      if (excludePasswords && input.type === "password") return;
      if (input.offsetWidth === 0 || input.offsetHeight === 0) return;

      let bestMatch: FormField | null = null;
      let highestScore = 0;

      for (const f of allFields) {
        const s = scoreMatch(input, f);
        if (s > highestScore) {
          highestScore = s;
          bestMatch = f;
        }
      }

      if (highestScore >= 3 && bestMatch) {
        matches.push({ el: input, field: bestMatch });
      }
    });

    return matches;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, globalFields, mutationTicker, isExcluded, excludePasswords]);

  const formGroups = useMemo(() => {
    if (!enablePerPage || isExcluded) return [];

    const groups: {
      form: HTMLFormElement | null;
      firstItem: { el: FormElement; field: FormField };
    }[] = [];
    highMatchElements.forEach((item) => {
      const form = item.el.closest("form");
      if (!groups.find((g) => g.form === form)) {
        groups.push({ form, firstItem: item });
      }
    });
    return groups;
  }, [highMatchElements, enablePerPage, isExcluded]);

  useEffect(() => {
    const pageUrl = window.location.origin + window.location.pathname;

    const syncFromStorage = (res: Record<string, unknown>) => {
      if (res.recordMode !== undefined)
        setRecordMode(Boolean(res.recordMode));
      if (res.enablePerField !== undefined)
        setEnablePerField(Boolean(res.enablePerField));
      if (res.enablePerPage !== undefined)
        setEnablePerPage(Boolean(res.enablePerPage));
      if (res.enableShortcut !== undefined)
        setEnableShortcut(Boolean(res.enableShortcut));
      if (typeof res.accentColor === "string")
        setAccentColor(res.accentColor);
      if (res.autoFillOnLoad !== undefined)
        setAutoFillOnLoad(Boolean(res.autoFillOnLoad));
      if (typeof res.autoFillDelay === "number")
        setAutoFillDelay(res.autoFillDelay);
      if (res.skipFilledFields !== undefined)
        setSkipFilledFields(Boolean(res.skipFilledFields));
      if (res.excludePasswords !== undefined)
        setExcludePasswords(Boolean(res.excludePasswords));
      if (Array.isArray(res.excludedDomains))
        setExcludedDomains(res.excludedDomains as string[]);
      if (typeof res.customShortcut === "string")
        setCustomShortcut(res.customShortcut);

      const { profiles, activeProfileId } = resolveProfilesFromStorage({
        profiles: res.profiles as Profile[] | undefined,
        activeProfileId: res.activeProfileId as string | undefined,
        globalFields: res.globalFields as FormField[] | undefined,
      });
      const activeProfile =
        profiles.find((p) => p.id === activeProfileId) || profiles[0];
      setGlobalFields(activeProfile?.fields || []);
    };

    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.recordMode)
        setRecordMode(Boolean(changes.recordMode.newValue));
      if (changes.enablePerField)
        setEnablePerField(Boolean(changes.enablePerField.newValue));
      if (changes.enablePerPage)
        setEnablePerPage(Boolean(changes.enablePerPage.newValue));
      if (changes.enableShortcut)
        setEnableShortcut(Boolean(changes.enableShortcut.newValue));
      if (changes.accentColor)
        setAccentColor(
          (changes.accentColor.newValue as string) || DEFAULT_ACCENT_COLOR,
        );
      if (changes.autoFillOnLoad)
        setAutoFillOnLoad(Boolean(changes.autoFillOnLoad.newValue));
      if (changes.autoFillDelay)
        setAutoFillDelay(Number(changes.autoFillDelay.newValue ?? 800));
      if (changes.skipFilledFields)
        setSkipFilledFields(Boolean(changes.skipFilledFields.newValue));
      if (changes.excludePasswords)
        setExcludePasswords(Boolean(changes.excludePasswords.newValue));
      if (changes.excludedDomains)
        setExcludedDomains(
          (changes.excludedDomains.newValue as string[]) || [],
        );
      if (changes.customShortcut)
        setCustomShortcut(
          String(changes.customShortcut.newValue || "Alt+Shift+A"),
        );

      if (
        changes.profiles ||
        changes.activeProfileId ||
        changes.globalFields
      ) {
        chrome.storage.local.get(
          ["profiles", "activeProfileId", "globalFields"],
          (res) => {
            const { profiles, activeProfileId } = resolveProfilesFromStorage(
              res as {
                profiles?: Profile[];
                activeProfileId?: string;
                globalFields?: FormField[];
              },
            );
            const activeProfile =
              profiles.find((p) => p.id === activeProfileId) || profiles[0];
            setGlobalFields(activeProfile?.fields || []);
          },
        );
      }

      if (changes.templates) {
        const newTemplates = changes.templates.newValue as TemplatesMap;
        setTemplate(findMatchingTemplate(newTemplates, pageUrl));
      }
    };

    chrome.storage.onChanged.addListener(listener);
    chrome.storage.local.get(
      [
        "profiles",
        "activeProfileId",
        "globalFields",
        "recordMode",
        "enablePerField",
        "enablePerPage",
        "enableShortcut",
        "accentColor",
        "autoFillOnLoad",
        "autoFillDelay",
        "skipFilledFields",
        "excludePasswords",
        "excludedDomains",
        "customShortcut",
      ],
      (res) => {
        syncFromStorage(res);
        chrome.runtime.sendMessage(
          { action: "getTemplate", payload: { url: pageUrl } },
          (response: { template?: TemplateData | null } | undefined) => {
            if (response && response.template) {
              setTemplate(response.template);
            }
          },
        );
      },
    );

    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    const handleKeyCommand = (message: { action: string }) => {
      if (message.action === "runAutofill") handleAutofill(document.body);
    };
    chrome.runtime.onMessage.addListener(handleKeyCommand);
    return () => chrome.runtime.onMessage.removeListener(handleKeyCommand);
  }, [handleAutofill]);

  useEffect(() => {
    if (recordMode && !isExcluded) {
      const handleSubmit = (e: Event) => {
        const form = e.target as HTMLFormElement;
        const fields = extractFields(form, excludePasswords);
        const url = window.location.origin + window.location.pathname;
        const name = document.title || url;
        chrome.runtime.sendMessage({
          action: "saveForm",
          payload: { url, data: { url, name, fields } },
        });
      };
      document.addEventListener("submit", handleSubmit, true);
      return () => document.removeEventListener("submit", handleSubmit, true);
    }
  }, [recordMode, isExcluded, excludePasswords]);

  if (isExcluded) {
    return null;
  }

  return (
    <>
      <style>{`
        .ghost-icon {
          position: absolute;
          z-index: 2147483647;
          cursor: pointer;
          pointer-events: auto;
          color: white;
          background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%);
          border-radius: 50%;
          padding: 6px;
          box-shadow: 0 4px 12px ${accentColor}44;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .ghost-icon:hover {
          transform: scale(1.2) rotate(15deg);
          box-shadow: 0 6px 16px ${accentColor}66;
        }
        .record-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: rgba(239, 68, 68, 0.95);
          backdrop-filter: blur(8px);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          font-size: 13px;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {recordMode && (
        <div className="record-banner">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "white",
              animation: "pulse 1.5s infinite",
            }}
          />
          Recording Submissions...
        </div>
      )}

      {enablePerField &&
        highMatchElements.map((item, idx) => {
          const rect = item.el.getBoundingClientRect();
          return (
            <div
              key={idx}
              className="ghost-icon"
              style={{
                top: window.scrollY + rect.top + rect.height / 2 - 14,
                left: window.scrollX + rect.right + 8,
              }}
              onClick={() => applyFieldValue(item.el, item.field)}
              title={`SmartFill: ${item.field.name || item.field.id || "field"}`}
            >
              <Sparkles size={14} />
            </div>
          );
        })}

      {enablePerPage &&
        formGroups.map((group, idx) => {
          const rect = group.firstItem.el.getBoundingClientRect();
          return (
            <div
              key={`form-${idx}`}
              className="ghost-icon"
              style={{
                top: window.scrollY + Math.max(0, rect.top - 36),
                left: window.scrollX + rect.left,
                padding: "8px 16px",
                borderRadius: "12px",
                width: "auto",
                gap: "8px",
              }}
              onClick={() => handleAutofill(group.form || group.firstItem.el)}
            >
              <Sparkles size={14} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  fontFamily: "system-ui",
                }}
              >
                Autofill Form
              </span>
            </div>
          );
        })}
    </>
  );
};

// Shadow Dom Injection
const container = document.createElement("div");
container.id = "smartform-architect-root";
container.style.cssText =
  "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;";
document.body.appendChild(container);

const shadowRoot = container.attachShadow({ mode: "open" });
const rootElement = document.createElement("div");
shadowRoot.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(<GhostOverlay />);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "forceSaveForm") {
    chrome.storage.local.get(["excludePasswords"], (res) => {
      const excludePw =
        res.excludePasswords !== undefined
          ? Boolean(res.excludePasswords)
          : true;
      const fields = extractFields(document, excludePw);
      const url = window.location.origin + window.location.pathname;
      const name = document.title || url;
      chrome.runtime.sendMessage(
        {
          action: "saveForm",
          payload: { url, data: { url, name, fields } },
        },
        () => sendResponse({ count: fields.length }),
      );
    });
    return true;
  }
});
