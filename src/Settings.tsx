import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  Activity,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Palette,
  Info,
  Github,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Zap,
  Globe,
  Plus,
  X,
  Lock,
} from "lucide-react";
import { DEFAULT_ACCENT_COLOR, DEFAULT_SETTINGS } from "./types/storage";
import { applyAccentTheme } from "./utils/matching";

interface SettingsProps {
  onBack: () => void;
  isInsideDashboard?: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  isInsideDashboard = false,
}) => {
  const [recordMode, setRecordMode] = useState(DEFAULT_SETTINGS.recordMode);
  const [enablePerField, setEnablePerField] = useState(
    DEFAULT_SETTINGS.enablePerField,
  );
  const [enablePerPage, setEnablePerPage] = useState(
    DEFAULT_SETTINGS.enablePerPage,
  );
  const [enableShortcut, setEnableShortcut] = useState(
    DEFAULT_SETTINGS.enableShortcut,
  );
  const [customShortcut, setCustomShortcut] = useState(
    DEFAULT_SETTINGS.customShortcut,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [autoFillOnLoad, setAutoFillOnLoad] = useState(
    DEFAULT_SETTINGS.autoFillOnLoad,
  );
  const [autoFillDelay, setAutoFillDelay] = useState(
    DEFAULT_SETTINGS.autoFillDelay,
  );
  const [skipFilledFields, setSkipFilledFields] = useState(
    DEFAULT_SETTINGS.skipFilledFields,
  );
  const [excludePasswords, setExcludePasswords] = useState(
    DEFAULT_SETTINGS.excludePasswords,
  );
  const [excludedDomains, setExcludedDomains] = useState<string[]>(
    DEFAULT_SETTINGS.excludedDomains,
  );
  const [newDomain, setNewDomain] = useState("");
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success">("idle");

  const appVersion = chrome?.runtime?.getManifest?.()?.version || "1.1.1";

  useEffect(() => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(
        [
          "recordMode",
          "enablePerField",
          "enablePerPage",
          "enableShortcut",
          "customShortcut",
          "autoFillOnLoad",
          "autoFillDelay",
          "skipFilledFields",
          "excludePasswords",
          "excludedDomains",
          "accentColor",
        ],
        (res) => {
          if (res.recordMode !== undefined)
            setRecordMode(Boolean(res.recordMode));
          if (res.enablePerField !== undefined)
            setEnablePerField(Boolean(res.enablePerField));
          if (res.enablePerPage !== undefined)
            setEnablePerPage(Boolean(res.enablePerPage));
          if (res.enableShortcut !== undefined)
            setEnableShortcut(Boolean(res.enableShortcut));
          if (res.customShortcut !== undefined)
            setCustomShortcut(String(res.customShortcut));
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
          if (typeof res.accentColor === "string") {
            setAccentColor(res.accentColor);
            applyAccentTheme(res.accentColor);
          }
        },
      );
    }
  }, []);

  const flashSaved = () => {
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  const updateSetting = (
    key: string,
    value: string | boolean | number | string[],
  ) => {
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ [key]: value }, flashSaved);
    } else {
      flashSaved();
    }

    switch (key) {
      case "recordMode":
        setRecordMode(value as boolean);
        break;
      case "enablePerField":
        setEnablePerField(value as boolean);
        break;
      case "enablePerPage":
        setEnablePerPage(value as boolean);
        break;
      case "enableShortcut":
        setEnableShortcut(value as boolean);
        break;
      case "customShortcut":
        setCustomShortcut(value as string);
        break;
      case "autoFillOnLoad":
        setAutoFillOnLoad(value as boolean);
        break;
      case "autoFillDelay":
        setAutoFillDelay(value as number);
        break;
      case "skipFilledFields":
        setSkipFilledFields(value as boolean);
        break;
      case "excludePasswords":
        setExcludePasswords(value as boolean);
        break;
      case "excludedDomains":
        setExcludedDomains(value as string[]);
        break;
      case "accentColor":
        setAccentColor(value as string);
        applyAccentTheme(value as string);
        break;
    }
  };

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const modifiers = [];
      if (e.ctrlKey) modifiers.push("Ctrl");
      if (e.altKey) modifiers.push("Alt");
      if (e.shiftKey) modifiers.push("Shift");
      if (e.metaKey) modifiers.push("Meta");

      const key = e.key === " " ? "Space" : e.key.toUpperCase();
      if (["CONTROL", "ALT", "SHIFT", "META"].includes(key)) return;

      const combo = [...modifiers, key].join("+");
      setCustomShortcut(combo);
      if (chrome && chrome.storage) {
        chrome.storage.local.set({ customShortcut: combo }, flashSaved);
      } else {
        flashSaved();
      }
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isRecording]);

  const handleAddExcludedDomain = () => {
    const cleaned = newDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!cleaned || excludedDomains.includes(cleaned)) {
      setNewDomain("");
      return;
    }
    updateSetting("excludedDomains", [...excludedDomains, cleaned]);
    setNewDomain("");
  };

  const handleRemoveExcludedDomain = (domain: string) => {
    updateSetting(
      "excludedDomains",
      excludedDomains.filter((d) => d !== domain),
    );
  };

  const handleExport = () => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(null, (allData) => {
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(allData, null, 2));
        const dlAnchorElem = document.createElement("a");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute(
          "download",
          `smartform-architect-backup-${Date.now()}.json`,
        );
        dlAnchorElem.click();
      });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (chrome && chrome.storage) {
          chrome.storage.local.set(json, () => {
            alert("Data imported successfully! The page will reload.");
            window.location.reload();
          });
        }
      } catch {
        alert("Invalid export file.");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      confirm(
        "DANGER: This will delete ALL templates, profiles, and global fields. Are you absolutely sure?",
      )
    ) {
      if (chrome && chrome.storage) {
        chrome.storage.local.clear(() => {
          chrome.storage.local.set(
            {
              ...DEFAULT_SETTINGS,
              templates: {},
              profiles: [{ id: "default", name: "Personal", fields: [] }],
              activeProfileId: "default",
            },
            () => {
              window.location.reload();
            },
          );
        });
      }
    }
  };

  const accents = [
    { name: "Sky Blue", color: "#58a6ff" },
    { name: "Emerald", color: "#3fb950" },
    { name: "Amber", color: "#d29922" },
    { name: "Coral", color: "#f85149" },
    { name: "Purple", color: "#bc8cff" },
  ];

  return (
    <div
      className={`flex flex-col animate-fade-in ${
        isInsideDashboard ? "p-10 max-w-4xl mx-auto" : "h-full"
      }`}
      style={{ color: "var(--text-main)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          {!isInsideDashboard && (
            <button
              onClick={onBack}
              className="btn btn-icon glass flex items-center justify-center"
              style={{ width: "36px", height: "36px" }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <h1
              style={{
                fontSize: isInsideDashboard ? "32px" : "20px",
                fontWeight: "700",
                lineHeight: 1.1,
              }}
            >
              Preferences
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Customize your SmartForm experience
            </p>
          </div>
        </div>
        {saveStatus === "success" && (
          <span className="badge badge-success animate-pulse flex items-center">
            Saved
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8 pb-10">
        {/* General Section */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <Activity size={18} color="var(--accent)" /> General
          </h3>
          <div className="grid gap-4">
            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Record Mode</h4>
                <p>Automatically detect and save forms when you submit them.</p>
              </div>
              <ToggleButton
                enabled={recordMode}
                onClick={() => updateSetting("recordMode", !recordMode)}
              />
            </div>

            <div className="settings-card glass">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4>Keyboard Shortcut</h4>
                  {enableShortcut && (
                    <button
                      onClick={() => setIsRecording(true)}
                      className={`badge ${isRecording ? "badge-danger animate-pulse" : "badge-accent"}`}
                      style={{
                        cursor: "pointer",
                        border: "none",
                        fontSize: "10px",
                        padding: "4px 8px",
                      }}
                    >
                      {isRecording ? "Press Keys..." : "Customize"}
                    </button>
                  )}
                </div>
                <p>
                  Current: <code>{customShortcut}</code>
                </p>
              </div>
              <ToggleButton
                enabled={enableShortcut}
                onClick={() => updateSetting("enableShortcut", !enableShortcut)}
              />
            </div>
          </div>
        </section>

        {/* Suggestions & Autofill Behavior Section */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <Sparkles size={18} color="var(--warning)" /> Autofill &amp; UI
          </h3>
          <div className="grid gap-4">
            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Per-Field Icons</h4>
                <p>
                  Show inline autofill icons next to matched input fields. Click
                  to fill that field.
                </p>
              </div>
              <ToggleButton
                enabled={enablePerField}
                onClick={() => updateSetting("enablePerField", !enablePerField)}
              />
            </div>

            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Per-Page Banner</h4>
                <p>Show a floating "Autofill Form" button above forms.</p>
              </div>
              <ToggleButton
                enabled={enablePerPage}
                onClick={() => updateSetting("enablePerPage", !enablePerPage)}
              />
            </div>

            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Auto-fill on Load</h4>
                <p>
                  Automatically fill matched forms as soon as a page finishes
                  loading.
                </p>
                {autoFillOnLoad && (
                  <div
                    className="flex items-center gap-2 mt-2"
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    <span>Delay:</span>
                    <select
                      value={autoFillDelay}
                      onChange={(e) =>
                        updateSetting("autoFillDelay", Number(e.target.value))
                      }
                      style={{
                        background: "var(--bg-color)",
                        color: "var(--text-main)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "12px",
                      }}
                    >
                      <option value={0}>Instant (0ms)</option>
                      <option value={400}>Fast (400ms)</option>
                      <option value={800}>Balanced (800ms)</option>
                      <option value={1500}>Slow SPA (1.5s)</option>
                      <option value={2500}>Heavy SPA (2.5s)</option>
                    </select>
                  </div>
                )}
              </div>
              <ToggleButton
                enabled={autoFillOnLoad}
                onClick={() => updateSetting("autoFillOnLoad", !autoFillOnLoad)}
              />
            </div>

            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Skip Already-Filled Fields</h4>
                <p>
                  Preserve values you have already typed instead of overwriting
                  them.
                </p>
              </div>
              <ToggleButton
                enabled={skipFilledFields}
                onClick={() =>
                  updateSetting("skipFilledFields", !skipFilledFields)
                }
              />
            </div>
          </div>
        </section>

        {/* Privacy & Domain Exclusions */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <Lock size={18} color="var(--success)" /> Privacy &amp; Exclusions
          </h3>
          <div className="grid gap-4">
            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Exclude Password Fields</h4>
                <p>
                  Never record or autofill password inputs (recommended for
                  security).
                </p>
              </div>
              <ToggleButton
                enabled={excludePasswords}
                onClick={() =>
                  updateSetting("excludePasswords", !excludePasswords)
                }
              />
            </div>

            <div className="card glass p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Globe size={16} color="var(--accent)" />
                <h4 style={{ fontSize: "15px", fontWeight: "600" }}>
                  Excluded Domains
                </h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                SmartForm Architect will stay completely inactive on these
                domains (e.g. banking sites).
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddExcludedDomain();
                  }}
                  placeholder="e.g. bankofamerica.com"
                  style={{
                    flex: 1,
                    background: "var(--bg-color)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "white",
                    fontSize: "12px",
                    outline: "none",
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddExcludedDomain}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {excludedDomains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {excludedDomains.map((domain) => (
                    <span
                      key={domain}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        background: "rgba(248, 81, 73, 0.12)",
                        border: "1px solid rgba(248, 81, 73, 0.25)",
                        color: "#ff7b72",
                      }}
                    >
                      {domain}
                      <button
                        onClick={() => handleRemoveExcludedDomain(domain)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "inherit",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                        }}
                        aria-label={`Remove ${domain}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <Palette size={18} color="var(--accent)" /> Appearance
          </h3>
          <div className="card glass p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h4 style={{ marginBottom: "8px" }}>Accent Color</h4>
                <p
                  style={{
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  Pick a preset or choose any custom hex color.
                </p>
                <div className="flex items-center gap-4">
                  {accents.map((acc) => (
                    <button
                      key={acc.color}
                      onClick={() => updateSetting("accentColor", acc.color)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: acc.color,
                        border:
                          accentColor === acc.color
                            ? "3px solid white"
                            : "none",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        boxShadow:
                          accentColor === acc.color
                            ? "0 0 10px " + acc.color
                            : "none",
                      }}
                      className="hover:scale-110"
                      title={acc.name}
                    />
                  ))}
                  <label
                    title="Custom Hex Color"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: "2px dashed var(--border-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      background: accentColor,
                    }}
                  >
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) =>
                        updateSetting("accentColor", e.target.value)
                      }
                      style={{
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Storage Section */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <ShieldAlert size={18} color="var(--danger)" /> Data Management
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              className="btn glass p-4 flex-col items-start gap-2 h-auto"
              onClick={handleExport}
            >
              <Download size={20} color="var(--accent)" />
              <div className="text-center">
                <span style={{ fontWeight: "600", display: "block" }}>
                  Export Data
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Backup templates &amp; profiles
                </span>
              </div>
            </button>
            <label className="btn glass p-4 flex-col items-start gap-2 h-auto cursor-pointer">
              <Upload size={20} color="var(--success)" />
              <div className="text-center">
                <span style={{ fontWeight: "600", display: "block" }}>
                  Import Data
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Restore from backup
                </span>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: "none" }}
              />
            </label>
            <button
              className="btn glass p-4 flex-col items-start gap-2 h-auto col-span-2 border-danger-dim"
              onClick={handleReset}
            >
              <RotateCcw size={20} color="var(--danger)" />
              <div className="text-center">
                <span
                  style={{
                    fontWeight: "600",
                    display: "block",
                    color: "var(--danger)",
                  }}
                >
                  Reset All Data
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Wipe everything clean. This cannot be undone.
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <Info size={18} color="var(--accent)" /> About
          </h3>
          <div className="card glass p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    background: "var(--accent-gradient)",
                    padding: "10px",
                    borderRadius: "12px",
                  }}
                >
                  <Zap size={24} color="white" />
                </div>
                <div>
                  <h4 style={{ fontWeight: "700" }}>SmartForm Architect</h4>
                  <span
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    Version {appVersion}
                  </span>
                </div>
              </div>
              <div className="badge badge-accent">Stable</div>
            </div>

            <p
              style={{
                fontSize: "13px",
                lineHeight: "1.6",
                color: "var(--text-muted)",
              }}
            >
              The ultimate productivity tool for heavy form fillers. Architect
              your web experience with custom templates, dynamic tags, and
              multi-profile personas.
            </p>

            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <Github size={14} /> GitHub
              </a>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .settings-card {
          padding: 18px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
        }
        .settings-card:hover {
          border-color: var(--accent);
          background: rgba(88, 166, 255, 0.03);
        }
        .settings-card h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .settings-card p {
          font-size: 12px;
          color: var(--text-muted);
          max-width: 260px;
        }
        .border-danger-dim {
          border-color: rgba(248, 81, 73, 0.2) !important;
        }
        .border-danger-dim:hover {
          border-color: var(--danger) !important;
          background: rgba(248, 81, 73, 0.05) !important;
        }
      `}</style>
    </div>
  );
};

interface ToggleButtonProps {
  enabled: boolean;
  onClick: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ enabled, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
      transition: "opacity 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {enabled ? (
      <ToggleRight size={40} color="var(--success)" />
    ) : (
      <ToggleLeft size={40} color="var(--text-muted)" />
    )}
  </button>
);

export default Settings;
