import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import {
  Settings as SettingsIcon,
  ExternalLink,
  Activity,
  ToggleLeft,
  ToggleRight,
  Plus,
  Sparkles,
  Zap,
} from "lucide-react";
import Settings from "./Settings";

function App() {
  const appVersion = chrome?.runtime?.getManifest?.()?.version || "1.0.0";

  useEffect(() => {
    console.log(`[SmartForm] Extension opened. Version: ${appVersion}`);
    return () => {
      console.log("[SmartForm] Extension closed");
    };
  }, [appVersion]);

  const [isDashboard, setIsDashboard] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "dashboard";
  });
  const [recordMode, setRecordMode] = useState(false);
  const [enablePerField, setEnablePerField] = useState(true);
  const [enablePerPage, setEnablePerPage] = useState(false);
  const [enableShortcut, setEnableShortcut] = useState(true);
  const [recentTemplates, setRecentTemplates] = useState<
    { url: string; name?: string; count: number }[]
  >([]);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeView, setActiveView] = useState<"main" | "settings">("main");

  useEffect(() => {
    if (isDashboard) return;

    document.body.className = "popup-view";

    // Load state
    if (chrome && chrome.storage) {
      chrome.storage.local.get(
        [
          "recordMode",
          "templates",
          "enablePerField",
          "enablePerPage",
          "enableShortcut",
        ],
        (res) => {
          if (res.recordMode !== undefined) {
            setRecordMode(Boolean(res.recordMode));
          }
          if (res.templates) {
            const templates = res.templates as Record<
              string,
              { fields: unknown[]; name?: string }
            >;
            const urls = Object.keys(templates).slice(-3).reverse();
            const populated = urls.map((u) => ({
              url: u,
              name: templates[u]?.name,
              count: templates[u]?.fields?.length || 0,
            }));
            setRecentTemplates(populated);
          }
          if (res.enablePerField !== undefined) {
            setEnablePerField(Boolean(res.enablePerField));
          }
          if (res.enablePerPage !== undefined) {
            setEnablePerPage(Boolean(res.enablePerPage));
          }
          if (res.enableShortcut !== undefined) {
            setEnableShortcut(Boolean(res.enableShortcut));
          }
        },
      );
    }
  }, [isDashboard]);

  const toggleRecordMode = () => {
    const newVal = !recordMode;
    console.log(`[SmartForm] Toggling record mode to: ${newVal}`);
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ recordMode: newVal }, () => {
        setRecordMode(newVal);
      });
    } else {
      setRecordMode(newVal); // for dev outside extension
    }
  };

  const toggleSetting = (
    key: "enablePerField" | "enablePerPage" | "enableShortcut",
    current: boolean,
  ) => {
    const newVal = !current;
    if (key === "enablePerField") setEnablePerField(newVal);
    if (key === "enablePerPage") setEnablePerPage(newVal);
    if (key === "enableShortcut") setEnableShortcut(newVal);

    if (chrome && chrome.storage) {
      chrome.storage.local.set({ [key]: newVal });
    }
  };

  const openDashboard = (url?: string) => {
    let target = "index.html?view=dashboard";
    if (url) target += `&url=${encodeURIComponent(url)}`;

    if (chrome && chrome.tabs) {
      chrome.tabs.create({
        url: chrome.runtime.getURL(target),
      });
    } else {
      setIsDashboard(true);
    }
  };

  const forceSaveForm = () => {
    console.log("[SmartForm] forceSaveForm clicked");
    if (chrome && chrome.tabs) {
      setSaveStatus("saving");
      setErrorMessage("");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "forceSaveForm" },
            (response: { count?: number } | undefined) => {
              if (chrome.runtime.lastError) {
                setSaveStatus("error");
                setErrorMessage(
                  chrome.runtime.lastError.message ===
                    "Could not establish connection. Receiving end does not exist."
                    ? "Content script not found. Please refresh the page you are on."
                    : `Error: ${chrome.runtime.lastError.message}`,
                );
                return;
              }
              if (response && response.count === 0) {
                setErrorMessage(
                  "0 fields auto-detected. Open Dashboard to add custom fields!",
                );
                setSaveStatus("error");
              } else if (response && response.count !== undefined) {
                setSaveStatus("success");
                setTimeout(() => setSaveStatus("idle"), 2000);
              }
              // Refresh recent templates
              setTimeout(() => {
                chrome.storage.local.get(["templates"], (res) => {
                  if (res.templates) {
                    const templates = res.templates as Record<
                      string,
                      { fields: unknown[]; name?: string }
                    >;
                    const urls = Object.keys(templates).slice(-3).reverse();
                    const populated = urls.map((u) => ({
                      url: u,
                      name: templates[u]?.name,
                      count: templates[u]?.fields?.length || 0,
                    }));
                    setRecentTemplates(populated);
                  }
                });
              }, 300);
            },
          );
        } else {
          setSaveStatus("error");
          setErrorMessage("No active tab found");
        }
      });
    }
  };

  if (isDashboard) {
    return <Dashboard />;
  }

  if (activeView === "settings") {
    return (
      <div
        className="popup-view"
        style={{ minHeight: "550px", padding: "20px" }}
      >
        <Settings onBack={() => setActiveView("main")} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{ height: "100%", padding: "20px" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          paddingBottom: "16px",
          marginBottom: "16px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              background: "var(--accent-gradient)",
              padding: "6px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(88, 166, 255, 0.3)",
            }}
          >
            <img
              src="/icon.png"
              alt="Logo"
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
            />
          </div>
          <div className="flex flex-col">
            <h1
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              SmartForm{" "}
              <span style={{ color: "var(--accent)" }}>Architect</span>
            </h1>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: "500",
              }}
            >
              v{appVersion} • Automated Productivity
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView("settings")}
            className="btn btn-icon glass"
            title="Preferences"
          >
            <SettingsIcon size={16} />
          </button>
          <button
            onClick={() => openDashboard()}
            className="btn btn-icon glass"
            title="Open Master Dashboard"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4" style={{ flex: 1 }}>
        {/* Record Mode Card */}
        <div className="card glass">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Activity
                  size={16}
                  color={recordMode ? "var(--success)" : "var(--text-muted)"}
                  className={recordMode ? "animate-pulse" : ""}
                />
                <h2
                  style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}
                >
                  Record Mode
                </h2>
                {recordMode && (
                  <span className="badge badge-success">Active</span>
                )}
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  lineHeight: 1.4,
                }}
              >
                {recordMode
                  ? "Observing & saving form structures as you submit them."
                  : "Turn on to automatically capture form structures."}
              </p>
            </div>
            <button
              onClick={toggleRecordMode}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "opacity 0.2s",
              }}
            >
              {recordMode ? (
                <ToggleRight size={38} color="var(--success)" />
              ) : (
                <ToggleLeft size={38} color="var(--text-muted)" />
              )}
            </button>
          </div>
        </div>

        {/* UI Customizations Card */}
        <div className="card glass">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} color="var(--accent)" />
              <h2
                style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}
              >
                Autofill Suggestions
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Per Field Icons
              </span>
              <button
                onClick={() => toggleSetting("enablePerField", enablePerField)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {enablePerField ? (
                  <ToggleRight size={28} color="var(--success)" />
                ) : (
                  <ToggleLeft size={28} color="var(--text-muted)" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Per Page Banner
              </span>
              <button
                onClick={() => toggleSetting("enablePerPage", enablePerPage)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {enablePerPage ? (
                  <ToggleRight size={28} color="var(--success)" />
                ) : (
                  <ToggleLeft size={28} color="var(--text-muted)" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-gray-700 pt-2 mt-1">
              <div className="flex items-center gap-2">
                <Zap size={14} color="var(--warning)" />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Keyboard Shortcut
                </span>
              </div>
              <button
                onClick={() => toggleSetting("enableShortcut", enableShortcut)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {enableShortcut ? (
                  <ToggleRight size={28} color="var(--success)" />
                ) : (
                  <ToggleLeft size={28} color="var(--text-muted)" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Templates Section */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Recent Templates
            </h2>
            <button
              onClick={forceSaveForm}
              disabled={saveStatus === "saving" || saveStatus === "success"}
              className={`btn btn-primary ${saveStatus === "success" ? "btn-success" : ""}`}
              style={{
                padding: "4px 10px",
                fontSize: "11px",
                borderRadius: "6px",
              }}
              title="Saves ALL forms currently visible on this webpage."
            >
              {saveStatus === "saving" ? (
                "Saving..."
              ) : saveStatus === "success" ? (
                <>
                  <Zap size={12} /> Saved!
                </>
              ) : (
                <>
                  <Plus size={12} /> Save Current
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: "11px",
                padding: "8px",
                backgroundColor: "rgba(248, 81, 73, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(248, 81, 73, 0.2)",
              }}
            >
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {recentTemplates.length > 0 ? (
              recentTemplates.map((template, idx) => {
                let hostname = template.url;
                try {
                  hostname = new URL(template.url).hostname;
                } catch {
                  // Fallback if not a valid URL
                }
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between card"
                    style={{
                      padding: "10px 14px",
                      backgroundColor: "var(--panel-bg-solid)",
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--accent)",
                        }}
                      ></div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#fff",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "180px",
                        }}
                        title={template.name || hostname}
                      >
                        {template.name || hostname}
                      </span>
                      <span
                        className="badge badge-accent"
                        style={{ fontSize: "9px", padding: "1px 6px" }}
                      >
                        {template.count} fields
                      </span>
                    </div>
                    <button
                      onClick={() => openDashboard(template.url)}
                      className="btn btn-icon glass"
                      title="Edit template fields"
                      style={{ width: "28px", height: "28px" }}
                    >
                      <SettingsIcon
                        size={14}
                        color="var(--text-muted)"
                        className="hover:text-accent transition-colors"
                      />
                    </button>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                }}
              >
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  No templates saved yet.
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Enable Record Mode to start capturing!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Meta Actions */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => openDashboard()}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Open Advanced Form Architect Dashboard <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
