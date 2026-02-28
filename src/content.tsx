/// <reference types="chrome"/>
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Sparkles } from "lucide-react";

interface FormField {
  id: string;
  name: string;
  placeholder: string;
  type: string;
  value: string;
}

interface TemplateData {
  url: string;
  name?: string;
  fields: FormField[];
}

function scoreMatch(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  savedField: FormField,
): number {
  let score = 0;

  const elId = (el.id || "").toLowerCase();
  const elName = (el.name || "").toLowerCase();
  const elPlaceholder =
    (el as HTMLInputElement).placeholder?.toLowerCase() || "";
  const elAriaLabel = el.getAttribute("aria-label")?.toLowerCase() || "";
  const elTitle = el.getAttribute("title")?.toLowerCase() || "";

  const sfId = (savedField.id || "").toLowerCase();
  const sfName = (savedField.name || "").toLowerCase();
  const sfPlaceholder = (savedField.placeholder || "").toLowerCase();

  // Exact ID or Name match is high confidence
  if (elId && sfId && elId === sfId) score += 5;
  if (elName && sfName && elName === sfName) score += 5;

  // Partial ID or Name match
  if (elId && sfName && elId.includes(sfName)) score += 2;
  if (elName && sfName && elName.includes(sfName)) score += 2;

  // Placeholder match
  if (elPlaceholder && sfPlaceholder && elPlaceholder === sfPlaceholder)
    score += 3;
  else if (elPlaceholder && sfName && elPlaceholder.includes(sfName))
    score += 2;

  // Aria-label and Title matching (very important for modern accessible web apps)
  if (elAriaLabel && sfName && elAriaLabel.includes(sfName)) score += 3;
  if (elTitle && sfName && elTitle.includes(sfName)) score += 2;

  // Label text matching
  if (el.labels && el.labels.length > 0) {
    const labelText = Array.from(el.labels)
      .map((l) => l.innerText)
      .join(" ")
      .toLowerCase();
    if (labelText && sfName && labelText.includes(sfName)) {
      score += 4;
    }
  } else {
    // Try to find nearby Label if not explicitly linked
    const nearbyLabel = el.parentElement
      ?.querySelector("label")
      ?.innerText.toLowerCase();
    if (nearbyLabel && sfName && nearbyLabel.includes(sfName)) {
      score += 2;
    }
  }

  return score;
}

const parseValue = async (val: string): Promise<string> => {
  if (val.includes("{{timestamp}}")) {
    val = val.replace(/\{\{timestamp\}\}/g, Date.now().toString());
  }
  if (val.includes("{{autoIncrement}}")) {
    const res = await new Promise<{ value: number }>((resolve) => {
      chrome.runtime.sendMessage({ action: "getAutoIncrement" }, resolve);
    });
    val = val.replace(/\{\{autoIncrement\}\}/g, String(res.value));
  }
  return val;
};

const extractFields = (
  container: HTMLElement | Document | HTMLFormElement,
): FormField[] => {
  const inputs = container.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(
    "input:not([type='hidden']):not([type='submit']):not([type='button']), textarea, select",
  );

  const fields: FormField[] = [];
  inputs.forEach((input) => {
    let val = input.value;

    if (input.type === "checkbox" || input.type === "radio") {
      const checked = (input as HTMLInputElement).checked;
      if (!checked) return; // Skip unchecked options
      val = val || "true";
    } else {
      if (!val || val.trim() === "") return; // Skip empty generic inputs
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

const VERSION = "1.1.0";
console.log(`[SmartForm] Initializing content script. Version: ${VERSION}`);

const GhostOverlay = () => {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [globalFields, setGlobalFields] = useState<FormField[]>([]);
  const [recordMode, setRecordMode] = useState(false);
  const [enablePerField, setEnablePerField] = useState(true);
  const [enablePerPage, setEnablePerPage] = useState(false);
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [autoFillOnLoad, setAutoFillOnLoad] = useState(false);
  const [customShortcut, setCustomShortcut] = useState("Alt+Shift+A");
  const [mutationTicker, setMutationTicker] = useState(0);

  const handleAutofill = useCallback(
    async (targetEl: HTMLElement) => {
      const container = targetEl.closest("form") || document;
      if (!template && globalFields.length === 0) return;

      const inputs = container.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input:not([type='hidden']):not([type='submit']), textarea, select");

      const allFields = [...(template?.fields || []), ...globalFields];
      const colorForPulse = accentColor || "#8b5cf6";

      for (const input of inputs) {
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
          const processedVal = await parseValue((bestMatch as FormField).value);
          if (input.type === "checkbox" || input.type === "radio") {
            const lowerVal = processedVal.toLowerCase();
            (input as HTMLInputElement).checked =
              processedVal === input.value ||
              ["true", "on", "checked"].includes(lowerVal);
          } else {
            input.value = processedVal;
          }

          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));

          // Premium feedback
          input.animate(
            [
              { boxShadow: `0 0 0 0 ${colorForPulse}00` },
              { boxShadow: `0 0 0 4px ${colorForPulse}66` },
              { boxShadow: `0 0 0 0 ${colorForPulse}00` },
            ],
            { duration: 600 },
          );
        }
      }
    },
    [template, globalFields, accentColor],
  );

  // Implement auto-fill on load
  useEffect(() => {
    if (autoFillOnLoad && (template || globalFields.length > 0)) {
      // Small delay to ensure page is ready
      const timer = setTimeout(() => {
        handleAutofill(document.body);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoFillOnLoad, template, globalFields, handleAutofill]);

  // Support custom shortcut via keydown
  useEffect(() => {
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
  }, [customShortcut, handleAutofill]);

  // Use MutationObserver instead of periodic ticker
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setMutationTicker((t) => t + 1);
      }, 500); // Debounce
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  const highMatchElements = useMemo(() => {
    const inputs = document.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input:not([type='hidden']):not([type='submit']), textarea, select");

    const matches: { el: HTMLElement; field: FormField }[] = [];
    const allFields = [...(template?.fields || []), ...globalFields];

    if (allFields.length === 0) return matches;

    inputs.forEach((input) => {
      // Don't match if hidden/not visible
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
    // mutationTicker is used to force re-evaluation when DOM changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, globalFields, mutationTicker]);

  const formGroups = useMemo(() => {
    if (!enablePerPage) return [];

    const groups: {
      form: HTMLFormElement | null;
      firstItem: { el: HTMLElement; field: FormField };
    }[] = [];
    highMatchElements.forEach((item) => {
      const form = item.el.closest("form");
      if (!groups.find((g) => g.form === form)) {
        groups.push({ form, firstItem: item });
      }
    });
    return groups;
  }, [highMatchElements, enablePerPage]);

  useEffect(() => {
    const url = window.location.origin + window.location.pathname;

    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.recordMode)
        setRecordMode(Boolean(changes.recordMode.newValue));
      if (changes.enablePerField)
        setEnablePerField(Boolean(changes.enablePerField.newValue));
      if (changes.enablePerPage)
        setEnablePerPage(Boolean(changes.enablePerPage.newValue));
      if (changes.accentColor)
        setAccentColor((changes.accentColor.newValue as string) || "#8b5cf6");
      if (changes.autoFillOnLoad)
        setAutoFillOnLoad(Boolean(changes.autoFillOnLoad.newValue));
      if (changes.customShortcut)
        setCustomShortcut(
          String(changes.customShortcut.newValue || "Alt+Shift+A"),
        );
      if (changes.globalFields)
        setGlobalFields((changes.globalFields.newValue as FormField[]) || []);
      if (changes.templates) {
        const newTemplates = changes.templates.newValue as Record<
          string,
          TemplateData
        >;
        if (newTemplates && newTemplates[url]) setTemplate(newTemplates[url]);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    chrome.storage.local.get(
      [
        "globalFields",
        "recordMode",
        "enablePerField",
        "enablePerPage",
        "accentColor",
        "autoFillOnLoad",
      ],
      (res) => {
        setRecordMode(Boolean(res.recordMode));
        if (res.enablePerField !== undefined)
          setEnablePerField(Boolean(res.enablePerField));
        if (res.enablePerPage !== undefined)
          setEnablePerPage(Boolean(res.enablePerPage));
        if (typeof res.accentColor === "string")
          setAccentColor(res.accentColor);
        if (res.autoFillOnLoad !== undefined)
          setAutoFillOnLoad(Boolean(res.autoFillOnLoad));
        if (res.globalFields) setGlobalFields(res.globalFields as FormField[]);

        chrome.runtime.sendMessage(
          { action: "getTemplate", payload: { url } },
          (response: { template?: TemplateData }) => {
            if (response && response.template) setTemplate(response.template);
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
    if (recordMode) {
      const handleSubmit = (e: Event) => {
        const form = e.target as HTMLFormElement;
        const fields = extractFields(form);
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
  }, [recordMode]);

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
              onClick={() => handleAutofill(item.el)}
              title="SmartFill Field"
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
    const fields = extractFields(document);
    const url = window.location.origin + window.location.pathname;
    const name = document.title || url;
    chrome.runtime.sendMessage(
      {
        action: "saveForm",
        payload: { url, data: { url, name, fields } },
      },
      () => sendResponse({ count: fields.length }),
    );
    return true;
  }
});
