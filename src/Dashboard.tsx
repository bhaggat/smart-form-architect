import React, { useEffect, useState, useMemo } from "react";
import {
  Download,
  Upload,
  Trash2,
  Type,
  Link as LinkIcon,
  Save,
  Plus,
  Search,
  BookOpen,
  ChevronRight,
  Sparkles,
  Zap,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import Settings from "./Settings";

interface FormField {
  id: string;
  name: string;
  placeholder: string;
  type: string;
  value: string;
}

interface Templates {
  [url: string]: {
    url: string;
    name?: string;
    fields: FormField[];
  };
}

const Dashboard = () => {
  const [templates, setTemplates] = useState<Templates>({});
  const [selectedUrl, setSelectedUrl] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("url");
  });
  const [editFields, setEditFields] = useState<FormField[]>([]);
  const [globalFields, setGlobalFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState<
    "templates" | "global" | "help" | "settings"
  >("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateName, setTemplateName] = useState("");

  const loadTemplates = () => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(["templates", "globalFields"], (res) => {
        if (res.templates) setTemplates(res.templates as Templates);
        if (res.globalFields) setGlobalFields(res.globalFields as FormField[]);
      });
    }
  };

  useEffect(() => {
    document.body.className = "dashboard-view";
    loadTemplates();

    if (selectedUrl && chrome && chrome.storage) {
      chrome.storage.local.get("templates", (res) => {
        const templatesData = (res.templates || {}) as Templates;
        if (templatesData[selectedUrl]) {
          setEditFields(templatesData[selectedUrl].fields || []);
          setTemplateName(templatesData[selectedUrl].name || "");
        }
      });
    }
  }, [selectedUrl]);

  const handleSelectUrl = (url: string) => {
    setSelectedUrl(url);
    const template = templates[url];
    setEditFields(template?.fields || []);
    setTemplateName(template?.name || "");
  };

  const handleSaveFields = () => {
    if (!selectedUrl) return;
    const newTemplates = { ...templates };
    newTemplates[selectedUrl].fields = editFields;
    newTemplates[selectedUrl].name = templateName;

    if (chrome && chrome.storage) {
      chrome.storage.local.set({ templates: newTemplates }, () => {
        setTemplates(newTemplates);
        // Better feedback than alert
        const btn = document.getElementById("save-template-btn");
        if (btn) {
          const original = btn.innerText;
          btn.innerText = "Saved!";
          btn.classList.add("btn-success");
          setTimeout(() => {
            btn.innerText = original;
            btn.classList.remove("btn-success");
          }, 2000);
        }
      });
    }
  };

  const handleSaveGlobalFields = () => {
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ globalFields }, () => {
        const btn = document.getElementById("save-global-btn");
        if (btn) {
          const original = btn.innerText;
          btn.innerText = "Saved!";
          btn.classList.add("btn-success");
          setTimeout(() => {
            btn.innerText = original;
            btn.classList.remove("btn-success");
          }, 2000);
        }
      });
    }
  };

  const handleCreateCustomField = () => {
    setEditFields([
      ...editFields,
      {
        id: "custom-" + Date.now(),
        name: "New Field",
        placeholder: "Label lookup",
        type: "text",
        value: "",
      },
    ]);
  };

  const handleCreateGlobalField = () => {
    setGlobalFields([
      ...globalFields,
      {
        id: "global-" + Date.now(),
        name: "New Global Field",
        placeholder: "Label lookup",
        type: "text",
        value: "",
      },
    ]);
  };

  const handleDeleteUrl = (url: string) => {
    if (confirm("Permanently delete this template? This cannot be undone.")) {
      const newTemplates = { ...templates };
      delete newTemplates[url];

      if (chrome && chrome.storage) {
        chrome.storage.local.set({ templates: newTemplates }, () => {
          setTemplates(newTemplates);
          if (selectedUrl === url) setSelectedUrl(null);
        });
      }
    }
  };

  const handleDeleteField = (idx: number) => {
    const updated = [...editFields];
    updated.splice(idx, 1);
    setEditFields(updated);
  };

  const handleDeleteGlobalField = (idx: number) => {
    const updated = [...globalFields];
    updated.splice(idx, 1);
    setGlobalFields(updated);
  };

  const updateFieldValue = (index: number, val: string) => {
    const updated = [...editFields];
    updated[index].value = val;
    setEditFields(updated);
  };

  const updateFieldName = (index: number, name: string) => {
    const updated = [...editFields];
    updated[index].name = name;
    setEditFields(updated);
  };

  const updateGlobalField = (
    index: number,
    key: "name" | "value",
    val: string,
  ) => {
    const updated = [...globalFields];
    updated[index][key] = val;
    setGlobalFields(updated);
  };

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(templates, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "smartform-architect-v1.json");
    dlAnchorElem.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (chrome && chrome.storage) {
          chrome.storage.local.get(
            "templates",
            (res: { templates?: Templates }) => {
              const existing = res.templates || {};
              const merged = { ...existing, ...json };
              chrome.storage.local.set({ templates: merged }, () => {
                setTemplates(merged);
              });
            },
          );
        }
      } catch {
        alert("Invalid template file format.");
      }
    };
    reader.readAsText(file);
  };

  const injectTag = (index: number, tag: string, isGlobal = false) => {
    if (isGlobal) {
      const updated = [...globalFields];
      updated[index].value = updated[index].value + tag;
      setGlobalFields(updated);
    } else {
      const updated = [...editFields];
      updated[index].value = updated[index].value + tag;
      setEditFields(updated);
    }
  };

  const filteredTemplates = useMemo(() => {
    return Object.keys(templates).filter((url) =>
      url.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [templates, searchQuery]);

  return (
    <div
      className="flex"
      style={{ height: "100vh", color: "var(--text-main)" }}
    >
      {/* Sidebar Panes */}
      <div
        className="glass"
        style={{
          width: "350px",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
        }}
      >
        <div style={{ padding: "32px 24px 20px" }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              style={{
                background: "var(--accent-gradient)",
                padding: "8px",
                borderRadius: "12px",
                boxShadow: "0 4px 15px rgba(88, 166, 255, 0.4)",
              }}
            >
              <img
                src="/icon.png"
                alt="Logo"
                style={{ width: "28px", height: "28px", objectFit: "contain" }}
              />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  letterSpacing: "-0.02em",
                }}
              >
                SmartForm{" "}
                <span style={{ color: "var(--accent)" }}>Architect</span>
              </h1>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontWeight: "500",
                }}
              >
                Master Settings Dashboard
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              className={`nav-btn ${activeTab === "templates" ? "active" : ""}`}
              onClick={() => setActiveTab("templates")}
            >
              <Save size={18} />
              <span>Form Templates</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </button>
            <button
              className={`nav-btn ${activeTab === "global" ? "active" : ""}`}
              onClick={() => setActiveTab("global")}
            >
              <Sparkles size={18} />
              <span>Global Fields</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </button>
            <button
              className={`nav-btn ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <SettingsIcon size={18} />
              <span>Preferences</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </button>
            <button
              className={`nav-btn ${activeTab === "help" ? "active" : ""}`}
              onClick={() => setActiveTab("help")}
            >
              <BookOpen size={18} />
              <span>Getting Started</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </button>
          </nav>
        </div>

        <div style={{ flex: 1, padding: "0 12px 24px", overflowY: "auto" }}>
          {activeTab === "templates" && (
            <div className="animate-fade-in">
              <div style={{ position: "relative", padding: "0 12px 16px" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "24px",
                    top: "10px",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 32px",
                    backgroundColor: "var(--panel-bg-solid)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "white",
                    outline: "none",
                  }}
                />
              </div>

              {filteredTemplates.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <HelpCircle
                    size={32}
                    style={{
                      color: "var(--border-strong)",
                      marginBottom: "12px",
                    }}
                  />
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    {searchQuery
                      ? "No matches found."
                      : "No templates saved yet."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredTemplates.map((url) => (
                    <div
                      key={url}
                      className={`template-item ${selectedUrl === url ? "active" : ""}`}
                      onClick={() => handleSelectUrl(url)}
                    >
                      <LinkIcon size={14} className="flex-shrink-0" />
                      <span
                        className="truncate flex-1"
                        title={templates[url]?.name || url}
                      >
                        {templates[url]?.name || new URL(url).hostname}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUrl(url);
                        }}
                        className="delete-icon"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "global" && (
            <div className="p-4 animate-fade-in">
              <div
                className="card"
                style={{
                  padding: "12px",
                  background: "rgba(88, 166, 255, 0.05)",
                  border: "1px solid rgba(88, 166, 255, 0.1)",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.6,
                    color: "var(--text-muted)",
                  }}
                >
                  Global fields are your{" "}
                  <strong style={{ color: "var(--accent)" }}>
                    Master Profile
                  </strong>
                  . They apply to all forms on all websites when matched
                  semantically.
                </p>
              </div>
            </div>
          )}

          {activeTab === "help" && (
            <div className="p-4 animate-fade-in flex flex-col gap-3">
              <div className="card glass" style={{ padding: "12px" }}>
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "4px",
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  <Zap size={12} color="var(--accent)" /> Quick Setup
                </h4>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  1. Enable <strong>Record Mode</strong> in the popup.
                  <br />
                  2. Submit any form on the web.
                  <br />
                  3. The extension captures it as a template here!
                </p>
              </div>
            </div>
          )}
        </div>

        <div
          style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}
        >
          <div className="flex gap-2">
            <button
              className="btn flex-1"
              onClick={handleExport}
              title="Export all templates to JSON"
            >
              <Download size={14} /> Export
            </button>
            <label className="btn flex-1 m-0" style={{ cursor: "pointer" }}>
              <Upload size={14} /> Import
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <main
          style={{ maxWidth: "900px", margin: "0 auto", padding: "64px 40px" }}
        >
          {activeTab === "templates" && selectedUrl ? (
            <div className="animate-fade-in">
              <header
                className="flex justify-between items-end mb-10 pb-8 border-bottom"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name..."
                    className="transparent-input"
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      letterSpacing: "-0.03em",
                      marginBottom: "8px",
                      width: "100%",
                      color: "white",
                    }}
                  />
                  <div className="flex items-center gap-2 text-accent">
                    <LinkIcon size={14} />
                    <span style={{ fontSize: "14px", opacity: 0.8 }}>
                      {selectedUrl}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="btn" onClick={handleCreateCustomField}>
                    <Plus size={16} /> Add Field
                  </button>
                  <button
                    className="btn btn-primary"
                    id="save-template-btn"
                    onClick={handleSaveFields}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </header>

              <div className="flex flex-col gap-6">
                {editFields.length > 0 ? (
                  editFields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="field-card animate-slide-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <Type size={16} color="var(--accent)" />
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) =>
                              updateFieldName(idx, e.target.value)
                            }
                            placeholder="Field Name (used for matching labels)"
                            className="transparent-input"
                            style={{ fontWeight: "600", fontSize: "15px" }}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="badge badge-accent">
                            Type: {field.type}
                          </span>
                          <button
                            onClick={() => handleDeleteField(idx)}
                            className="delete-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          <label
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              fontWeight: "500",
                            }}
                          >
                            Value / Template Tag
                          </label>
                        </div>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              updateFieldValue(idx, e.target.value)
                            }
                            placeholder="Static value or dyn-tags..."
                            className="styled-input"
                          />
                          <button
                            className="tag-btn"
                            onClick={() => injectTag(idx, "{{timestamp}}")}
                            title="Insert current timestamp"
                          >
                            <Plus size={14} /> ts
                          </button>
                          <button
                            className="tag-btn"
                            onClick={() => injectTag(idx, "{{autoIncrement}}")}
                            title="Insert auto-incrementing number"
                          >
                            <Plus size={14} /> inc
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "80px 40px",
                      textAlign: "center",
                      border: "2px dashed var(--border-strong)",
                      borderRadius: "16px",
                    }}
                  >
                    <BookOpen
                      size={48}
                      style={{
                        color: "var(--border-strong)",
                        marginBottom: "16px",
                      }}
                    />
                    <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>
                      No fields in this template
                    </h3>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "14px",
                        maxWidth: "400px",
                        margin: "0 auto",
                      }}
                    >
                      This template was captured without any detected fields.
                      You can manually add fields or try recording again.
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: "24px" }}
                      onClick={handleCreateCustomField}
                    >
                      <Plus size={16} /> Add First Field
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "global" ? (
            <div className="animate-fade-in">
              <header
                className="flex justify-between items-end mb-10 pb-8 border-bottom"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: "700",
                      letterSpacing: "-0.03em",
                      marginBottom: "8px",
                    }}
                  >
                    Global Fields
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                    Universal values applied across all forms based on semantic
                    naming.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="btn" onClick={handleCreateGlobalField}>
                    <Plus size={16} /> Add Global Field
                  </button>
                  <button
                    className="btn btn-primary"
                    id="save-global-btn"
                    onClick={handleSaveGlobalFields}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </header>

              <div className="flex flex-col gap-6">
                {globalFields.length > 0 ? (
                  globalFields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="field-card animate-slide-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <Sparkles size={16} color="var(--accent)" />
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) =>
                              updateGlobalField(idx, "name", e.target.value)
                            }
                            placeholder="e.g. phone, country, zip_code"
                            className="transparent-input"
                            style={{ fontWeight: "600", fontSize: "15px" }}
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteGlobalField(idx)}
                          className="delete-btn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            fontWeight: "500",
                          }}
                        >
                          Universal Value
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              updateGlobalField(idx, "value", e.target.value)
                            }
                            className="styled-input"
                          />
                          <button
                            className="tag-btn"
                            onClick={() =>
                              injectTag(idx, "{{timestamp}}", true)
                            }
                          >
                            <Plus size={14} /> ts
                          </button>
                          <button
                            className="tag-btn"
                            onClick={() =>
                              injectTag(idx, "{{autoIncrement}}", true)
                            }
                          >
                            <Plus size={14} /> inc
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card glass p-10 text-center">
                    <p style={{ color: "var(--text-muted)" }}>
                      No global fields yet. Add some to build your profile!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "help" ? (
            <div className="animate-fade-in">
              <h2
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  letterSpacing: "-0.03em",
                  marginBottom: "32px",
                }}
              >
                Guide to Mastery
              </h2>

              <div className="flex flex-col gap-10">
                <section>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      marginBottom: "16px",
                      color: "var(--accent)",
                    }}
                  >
                    The Workflow
                  </h3>
                  <div className="flex gap-6">
                    <div className="card glass flex-1 p-6">
                      <div className="badge-circle mb-4">1</div>
                      <h4 className="mb-2">Capture</h4>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--text-muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        Open any webpage with a form. Open the extension popup,
                        enable <strong>Record Mode</strong>, and submit the
                        form.
                      </p>
                    </div>
                    <div className="card glass flex-1 p-6">
                      <div className="badge-circle mb-4">2</div>
                      <h4 className="mb-2">Refine</h4>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--text-muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        Visit this dashboard. Select the captured URL and refine
                        the values. Use{" "}
                        <strong>&#123;&#123;timestamp&#125;&#125;</strong> for
                        unique values.
                      </p>
                    </div>
                    <div className="card glass flex-1 p-6">
                      <div className="badge-circle mb-4">3</div>
                      <h4 className="mb-2">Execute</h4>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--text-muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        Head back to the form. Click the purple sparkle icons or
                        use <strong>Opt+A</strong> (Mac) /{" "}
                        <strong>Alt+A</strong> (Win) to autofill instantly.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      marginBottom: "16px",
                      color: "var(--accent)",
                    }}
                  >
                    Dynamic Tags
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="card" style={{ padding: "20px" }}>
                      <code
                        style={{
                          background: "var(--bg-color)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          color: "var(--accent)",
                          display: "inline-block",
                          marginBottom: "10px",
                        }}
                      >
                        &#123;&#123;timestamp&#125;&#125;
                      </code>
                      <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                        Replaces with current millisecond time. Perfect for
                        unique emails:{" "}
                        <code>
                          user+&#123;&#123;timestamp&#125;&#125;@gmail.com
                        </code>
                      </p>
                    </div>
                    <div className="card" style={{ padding: "20px" }}>
                      <code
                        style={{
                          background: "var(--bg-color)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          color: "var(--accent)",
                          display: "inline-block",
                          marginBottom: "10px",
                        }}
                      >
                        &#123;&#123;autoIncrement&#125;&#125;
                      </code>
                      <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                        Replaces with a number that goes up +1 every time you
                        autofill. Great for sequential testing.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : activeTab === "settings" ? (
            <div className="animate-fade-in">
              <Settings
                onBack={() => setActiveTab("templates")}
                isInsideDashboard={true}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 opacity-50">
              <Sparkles size={64} style={{ marginBottom: "20px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: "600" }}>
                Select a template to begin
              </h2>
              <p>
                Choose from the sidebar or enable Record Mode to capture your
                first form.
              </p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .nav-btn.active {
          background: rgba(88, 166, 255, 0.1);
          color: var(--accent);
          font-weight: 600;
        }
        .nav-btn.active svg {
          color: var(--accent);
        }

        .template-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-muted);
          font-size: 14px;
          margin: 0 12px;
        }
        .template-item:hover {
          background: rgba(88, 166, 255, 0.05);
          color: white;
        }
        .template-item.active {
          background: var(--border-strong);
          color: white;
          font-weight: 500;
        }
        .delete-icon {
          opacity: 0;
          background: transparent;
          border: none;
          color: var(--danger);
          cursor: pointer;
          padding: 4px;
        }
        .template-item:hover .delete-icon {
          opacity: 0.8;
        }
        .delete-icon:hover {
          opacity: 1 !important;
        }

        .field-card {
          background: var(--panel-bg-solid);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: transform 0.2s;
        }
        .field-card:hover {
          background: #1c2128;
        }

        .transparent-input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
        }
        .transparent-input:focus {
          border-bottom: 1px solid var(--accent);
        }

        .styled-input {
          flex: 1;
          background: var(--bg-color);
          border: 1px solid var(--border-strong);
          border-radius: 8px;
          padding: 10px 14px;
          color: white;
          font-size: 14px;
          outline: none;
        }
        .styled-input:focus {
          border-color: var(--accent);
        }

        .tag-btn {
          padding: 0 12px;
          border-radius: 8px;
          background: var(--border-strong);
          border: none;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .tag-btn:hover {
          background: var(--accent);
          color: white;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .delete-btn:hover {
          color: var(--danger);
          background: rgba(248, 81, 73, 0.1);
        }

        .badge-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
