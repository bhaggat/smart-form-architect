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
  ExternalLink,
  Github,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Zap,
} from "lucide-react";

interface SettingsProps {
  onBack: () => void;
  isInsideDashboard?: boolean;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  isInsideDashboard = false,
}) => {
  const [recordMode, setRecordMode] = useState(false);
  const [enablePerField, setEnablePerField] = useState(true);
  const [enablePerPage, setEnablePerPage] = useState(false);
  const [enableShortcut, setEnableShortcut] = useState(true);
  const [customShortcut, setCustomShortcut] = useState("Alt+Shift+A");
  const [isRecording, setIsRecording] = useState(false);
  const [autoFillOnLoad, setAutoFillOnLoad] = useState(false);
  const [accentColor, setAccentColor] = useState("#58a6ff");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success">("idle");

  const appVersion = chrome?.runtime?.getManifest?.()?.version || "1.0.0";

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
          if (typeof res.accentColor === "string")
            setAccentColor(res.accentColor);
        },
      );
    }
  }, []);

  const updateSetting = (key: string, value: string | boolean) => {
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ [key]: value }, () => {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 1500);
      });
    }

    // Update local state
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
      case "accentColor":
        setAccentColor(value as string);
        document.documentElement.style.setProperty("--accent", value as string);
        break;
    }
  };

  const startRecording = () => {
    setIsRecording(true);
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
      // Ignore alone modifiers
      if (["CONTROL", "ALT", "SHIFT", "META"].includes(key)) return;

      const combo = [...modifiers, key].join("+");
      updateSetting("customShortcut", combo);
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isRecording]);

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
          `smartform-architect-vfull-${Date.now()}.json`,
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
        "DANGER: This will delete ALL templates and global fields. Are you absolutely sure?",
      )
    ) {
      if (chrome && chrome.storage) {
        chrome.storage.local.clear(() => {
          chrome.storage.local.set(
            {
              enablePerField: true,
              enableShortcut: true,
              recordMode: false,
              customShortcut: "Alt+Shift+A",
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
                      onClick={startRecording}
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

        {/* Suggestions Section */}
        <section className="flex flex-col gap-4">
          <h3 className="section-title">
            <Sparkles size={18} color="var(--warning)" /> Autofill & UI
          </h3>
          <div className="grid gap-4">
            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Per-Field Icons</h4>
                <p>Show small autofill icons inside detected input fields.</p>
              </div>
              <ToggleButton
                enabled={enablePerField}
                onClick={() => updateSetting("enablePerField", !enablePerField)}
              />
            </div>

            <div className="settings-card glass">
              <div className="flex-1">
                <h4>Per-Page Banner</h4>
                <p>Show a prominent floating banner on pages with forms.</p>
              </div>
              <ToggleButton
                enabled={enablePerPage}
                onClick={() => updateSetting("enablePerPage", !enablePerPage)}
              />
            </div>

            <div className="settings-card glass text-muted-opacity">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4>Auto-fill on Load</h4>
                  <span
                    className="badge badge-accent"
                    style={{ transform: "scale(0.8)" }}
                  >
                    Coming Soon
                  </span>
                </div>
                <p>
                  Automatically fill forms as soon as the page finishes loading.
                </p>
              </div>
              <ToggleButton
                enabled={autoFillOnLoad}
                onClick={() => updateSetting("autoFillOnLoad", !autoFillOnLoad)}
              />
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
                  Pick a color that suits your style.
                </p>
                <div className="flex gap-4">
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
                  Backup all templates
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
              The ultimate productivity tool for heavy form filers. Architect
              your web experience with custom templates and universal profiles.
            </p>

            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <Github size={14} /> GitHub
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <ExternalLink size={14} /> Website
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
          max-width: 250px;
        }
        .border-danger-dim {
          border-color: rgba(248, 81, 73, 0.2) !important;
        }
        .border-danger-dim:hover {
          border-color: var(--danger) !important;
          background: rgba(248, 81, 73, 0.05) !important;
        }
        .text-muted-opacity {
          opacity: 0.6;
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
