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
  Copy,
  User,
  Tag,
} from "lucide-react";
import Settings from "./Settings";
import type {
  FormField,
  MatchMode,
  Profile,
  TemplatesMap,
} from "./types/storage";
import { DYNAMIC_TAGS } from "./utils/tags";
import {
  applyAccentTheme,
  resolveProfilesFromStorage,
  safeHostname,
} from "./utils/matching";

const FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "url",
  "number",
  "date",
  "select",
  "checkbox",
];

const Dashboard = () => {
  const [templates, setTemplates] = useState<TemplatesMap>({});
  const [selectedUrl, setSelectedUrl] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("url");
  });
  const [editFields, setEditFields] = useState<FormField[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateMatchMode, setTemplateMatchMode] =
    useState<MatchMode>("exact");
  const [templateCategory, setTemplateCategory] = useState("");

  const [profiles, setProfiles] = useState<Profile[]>([
    { id: "default", name: "Personal", fields: [] },
  ]);
  const [activeProfileId, setActiveProfileId] = useState("default");
  const [editingProfileId, setEditingProfileId] = useState("default");

  const [activeTab, setActiveTab] = useState<
    "templates" | "global" | "help" | "settings"
  >("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadStorageData = () => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(
        [
          "templates",
          "globalFields",
          "profiles",
          "activeProfileId",
          "accentColor",
        ],
        (res) => {
          if (res.templates) setTemplates(res.templates as TemplatesMap);
          if (typeof res.accentColor === "string") {
            applyAccentTheme(res.accentColor);
          }
          const resolved = resolveProfilesFromStorage(
            res as {
              profiles?: Profile[];
              activeProfileId?: string;
              globalFields?: FormField[];
            },
          );
          setProfiles(resolved.profiles);
          setActiveProfileId(resolved.activeProfileId);
          setEditingProfileId(resolved.activeProfileId);
        },
      );
    }
  };

  useEffect(() => {
    document.body.className = "dashboard-view";
    loadStorageData();

    if (selectedUrl && chrome && chrome.storage) {
      chrome.storage.local.get("templates", (res) => {
        const templatesData = (res.templates || {}) as TemplatesMap;
        if (templatesData[selectedUrl]) {
          setEditFields(templatesData[selectedUrl].fields || []);
          setTemplateName(templatesData[selectedUrl].name || "");
          setTemplateMatchMode(templatesData[selectedUrl].matchMode || "exact");
          setTemplateCategory(templatesData[selectedUrl].category || "");
        }
      });
    }
  }, [selectedUrl]);

  const handleSelectUrl = (url: string) => {
    setSelectedUrl(url);
    const template = templates[url];
    setEditFields(template?.fields || []);
    setTemplateName(template?.name || "");
    setTemplateMatchMode(template?.matchMode || "exact");
    setTemplateCategory(template?.category || "");
  };

  const flashButton = (id: string) => {
    const btn = document.getElementById(id);
    if (btn) {
      const original = btn.innerText;
      btn.innerText = "Saved!";
      btn.classList.add("btn-success");
      setTimeout(() => {
        btn.innerText = original;
        btn.classList.remove("btn-success");
      }, 2000);
    }
  };

  const handleSaveFields = () => {
    if (!selectedUrl) return;
    const newTemplates: TemplatesMap = { ...templates };
    newTemplates[selectedUrl] = {
      ...newTemplates[selectedUrl],
      url: selectedUrl,
      fields: editFields,
      name: templateName,
      matchMode: templateMatchMode,
      category: templateCategory.trim(),
      updatedAt: Date.now(),
    };

    if (chrome && chrome.storage) {
      chrome.storage.local.set({ templates: newTemplates }, () => {
        setTemplates(newTemplates);
        flashButton("save-template-btn");
      });
    }
  };

  const handleCreateTemplate = () => {
    const rawUrl = prompt(
      "Enter the target URL (e.g. https://example.com/signup):",
    );
    if (!rawUrl || !rawUrl.trim()) return;
    const cleanUrl = rawUrl.trim();
    if (templates[cleanUrl]) {
      handleSelectUrl(cleanUrl);
      return;
    }
    const newTpl = {
      url: cleanUrl,
      name: safeHostname(cleanUrl),
      matchMode: "exact" as MatchMode,
      category: "",
      updatedAt: Date.now(),
      fields: [],
    };
    const updated = { ...templates, [cleanUrl]: newTpl };
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ templates: updated }, () => {
        setTemplates(updated);
        handleSelectUrl(cleanUrl);
      });
    } else {
      setTemplates(updated);
      handleSelectUrl(cleanUrl);
    }
  };

  const handleDuplicateTemplate = () => {
    if (!selectedUrl || !templates[selectedUrl]) return;
    const newUrl = prompt(
      "Enter URL key for the duplicated template:",
      `${selectedUrl}-copy`,
    );
    if (!newUrl || !newUrl.trim()) return;
    const key = newUrl.trim();
    const copy = {
      ...templates[selectedUrl],
      url: key,
      name: `${templateName || safeHostname(selectedUrl)} (Copy)`,
      fields: editFields.map((f) => ({ ...f, id: `${f.id}-${Date.now()}` })),
      updatedAt: Date.now(),
    };
    const updated = { ...templates, [key]: copy };
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ templates: updated }, () => {
        setTemplates(updated);
        handleSelectUrl(key);
      });
    }
  };

  const currentEditingProfile = useMemo(
    () => profiles.find((p) => p.id === editingProfileId) || profiles[0],
    [profiles, editingProfileId],
  );

  const persistProfiles = (
    nextProfiles: Profile[],
    nextActiveId = activeProfileId,
  ) => {
    setProfiles(nextProfiles);
    setActiveProfileId(nextActiveId);
    const activeObj =
      nextProfiles.find((p) => p.id === nextActiveId) || nextProfiles[0];
    if (chrome && chrome.storage) {
      chrome.storage.local.set(
        {
          profiles: nextProfiles,
          activeProfileId: nextActiveId,
          globalFields: activeObj?.fields || [],
        },
        () => flashButton("save-global-btn"),
      );
    }
  };

  const handleCreateProfile = () => {
    const name = prompt("New Profile Name (e.g. Work, QA Testing, Client):");
    if (!name || !name.trim()) return;
    const newProfile: Profile = {
      id: `profile-${Date.now()}`,
      name: name.trim(),
      fields: [],
    };
    const next = [...profiles, newProfile];
    setEditingProfileId(newProfile.id);
    persistProfiles(next, activeProfileId);
  };

  const handleRenameProfile = (id: string) => {
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    const nextName = prompt("Rename profile:", target.name);
    if (!nextName || !nextName.trim()) return;
    const next = profiles.map((p) =>
      p.id === id ? { ...p, name: nextName.trim() } : p,
    );
    persistProfiles(next, activeProfileId);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert("You must keep at least one profile.");
      return;
    }
    if (!confirm("Delete this profile and all its fields?")) return;
    const next = profiles.filter((p) => p.id !== id);
    const nextActive = activeProfileId === id ? next[0].id : activeProfileId;
    if (editingProfileId === id) setEditingProfileId(next[0].id);
    persistProfiles(next, nextActive);
  };

  const handleSaveGlobalFields = () => {
    persistProfiles(profiles, activeProfileId);
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
    const next = profiles.map((p) =>
      p.id === currentEditingProfile.id
        ? {
            ...p,
            fields: [
              ...p.fields,
              {
                id: "global-" + Date.now(),
                name: "New Global Field",
                placeholder: "Label lookup",
                type: "text",
                value: "",
              },
            ],
          }
        : p,
    );
    setProfiles(next);
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
    const next = profiles.map((p) => {
      if (p.id !== currentEditingProfile.id) return p;
      const updated = [...p.fields];
      updated.splice(idx, 1);
      return { ...p, fields: updated };
    });
    setProfiles(next);
  };

  const updateFieldProp = (
    index: number,
    key: keyof FormField,
    val: string,
  ) => {
    const updated = [...editFields];
    updated[index] = { ...updated[index], [key]: val };
    setEditFields(updated);
  };

  const updateGlobalField = (
    index: number,
    key: keyof FormField,
    val: string,
  ) => {
    const next = profiles.map((p) => {
      if (p.id !== currentEditingProfile.id) return p;
      const updated = [...p.fields];
      updated[index] = { ...updated[index], [key]: val };
      return { ...p, fields: updated };
    });
    setProfiles(next);
  };

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(templates, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "smartform-architect-templates.json");
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
            (res: { templates?: TemplatesMap }) => {
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
      const targetField = currentEditingProfile.fields[index];
      updateGlobalField(index, "value", (targetField?.value || "") + tag);
    } else {
      const updated = [...editFields];
      updated[index] = {
        ...updated[index],
        value: (updated[index].value || "") + tag,
      };
      setEditFields(updated);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    Object.values(templates).forEach((t) => {
      if (t.category && t.category.trim()) set.add(t.category.trim());
    });
    return Array.from(set).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return Object.keys(templates).filter((url) => {
      const tpl = templates[url];
      if (
        categoryFilter !== "all" &&
        (tpl.category || "").trim() !== categoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        url.toLowerCase().includes(q) ||
        (tpl?.name || "").toLowerCase().includes(q) ||
        (tpl?.category || "").toLowerCase().includes(q)
      );
    });
  }, [templates, searchQuery, categoryFilter]);

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
              <User size={18} />
              <span>Profiles &amp; Global Fields</span>
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
              <div
                className="flex flex-col gap-2"
                style={{ padding: "0 12px 16px" }}
              >
                <div className="flex gap-2">
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search
                      size={14}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "10px",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Filter name, URL..."
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
                  <button
                    onClick={handleCreateTemplate}
                    className="btn btn-primary"
                    title="Create new template"
                    style={{ padding: "8px 10px" }}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                {categories.length > 0 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      backgroundColor: "var(--panel-bg-solid)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      outline: "none",
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
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
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span
                          className="truncate"
                          title={templates[url]?.name || url}
                        >
                          {templates[url]?.name || safeHostname(url)}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {templates[url]?.fields?.length || 0} fields
                          {templates[url]?.matchMode &&
                          templates[url]?.matchMode !== "exact"
                            ? ` • ${templates[url].matchMode}`
                            : ""}
                        </span>
                      </div>
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
            <div className="p-4 animate-fade-in flex flex-col gap-3">
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
                  Create multiple{" "}
                  <strong style={{ color: "var(--accent)" }}>Profiles</strong>{" "}
                  (Personal, Work, QA) and switch between them anytime from the
                  popup.
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
                  3. Refine fields, match modes, and dynamic tags here!
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
                className="flex flex-col gap-6 mb-10 pb-8 border-bottom"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex justify-between items-end gap-4">
                  <div className="flex-1">
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
                  <div className="flex gap-2">
                    <button
                      className="btn"
                      onClick={handleDuplicateTemplate}
                      title="Duplicate template"
                    >
                      <Copy size={15} /> Duplicate
                    </button>
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
                </div>

                {/* Template Match Mode & Category */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      Match Mode:
                    </span>
                    <select
                      value={templateMatchMode}
                      onChange={(e) =>
                        setTemplateMatchMode(e.target.value as MatchMode)
                      }
                      style={{
                        background: "var(--panel-bg-solid)",
                        color: "white",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    >
                      <option value="exact">Exact URL Path</option>
                      <option value="domain">Entire Domain</option>
                      <option value="prefix">URL Prefix / Wildcard</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag size={14} color="var(--text-muted)" />
                    <input
                      type="text"
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                      placeholder="Category (e.g. Auth, Billing)"
                      style={{
                        background: "var(--panel-bg-solid)",
                        color: "white",
                        border: "1px solid var(--border-strong)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        outline: "none",
                        width: "200px",
                      }}
                    />
                  </div>
                </div>
              </header>

              <div className="flex flex-col gap-6">
                {editFields.length > 0 ? (
                  editFields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="field-card animate-slide-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="flex justify-between items-center mb-4 gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Type size={16} color="var(--accent)" />
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) =>
                              updateFieldProp(idx, "name", e.target.value)
                            }
                            placeholder="Field Name (used for matching labels)"
                            className="transparent-input"
                            style={{ fontWeight: "600", fontSize: "15px" }}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={field.type || "text"}
                            onChange={(e) =>
                              updateFieldProp(idx, "type", e.target.value)
                            }
                            style={{
                              background: "var(--bg-color)",
                              color: "var(--accent)",
                              border: "1px solid var(--border-strong)",
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 600,
                              outline: "none",
                            }}
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteField(idx)}
                            className="delete-btn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) =>
                              updateFieldProp(idx, "value", e.target.value)
                            }
                            placeholder="Static value or dynamic tags..."
                            className="styled-input"
                          />
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) =>
                              updateFieldProp(
                                idx,
                                "placeholder",
                                e.target.value,
                              )
                            }
                            placeholder="Placeholder hint (optional)"
                            className="styled-input"
                            style={{ maxWidth: "220px", fontSize: "12px" }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {DYNAMIC_TAGS.map((dt) => (
                            <button
                              key={dt.tag}
                              className="tag-btn"
                              style={{ padding: "4px 10px" }}
                              onClick={() => injectTag(idx, dt.tag)}
                              title={`${dt.label}: ${dt.description}`}
                            >
                              <Plus size={12} /> {dt.shortLabel}
                            </button>
                          ))}
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
                      You can manually add fields below or record a submission
                      on the target page.
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
                className="flex justify-between items-end mb-8 pb-6 border-bottom"
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
                    Profiles &amp; Global Fields
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                    Universal values applied across all forms based on semantic
                    naming.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="btn" onClick={handleCreateProfile}>
                    <Plus size={16} /> New Profile
                  </button>
                  <button className="btn" onClick={handleCreateGlobalField}>
                    <Plus size={16} /> Add Field
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

              {/* Profile Selector Pills */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {profiles.map((profile) => {
                  const isEditing = profile.id === currentEditingProfile.id;
                  const isActive = profile.id === activeProfileId;
                  return (
                    <div
                      key={profile.id}
                      onClick={() => setEditingProfileId(profile.id)}
                      className={`card flex items-center gap-2 cursor-pointer`}
                      style={{
                        padding: "8px 14px",
                        borderColor: isEditing
                          ? "var(--accent)"
                          : "var(--border)",
                        background: isEditing
                          ? "rgba(88, 166, 255, 0.1)"
                          : "var(--panel-bg-solid)",
                      }}
                    >
                      <User size={14} color="var(--accent)" />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>
                        {profile.name}
                      </span>
                      {isActive && (
                        <span className="badge badge-success">Active</span>
                      )}
                      {!isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            persistProfiles(profiles, profile.id);
                          }}
                          className="badge badge-accent"
                          style={{ border: "none", cursor: "pointer" }}
                        >
                          Use
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameProfile(profile.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        Rename
                      </button>
                      {profiles.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                          className="delete-btn"
                          style={{ padding: "2px" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-6">
                {currentEditingProfile.fields.length > 0 ? (
                  currentEditingProfile.fields.map((field, idx) => (
                    <div
                      key={field.id || idx}
                      className="field-card animate-slide-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}
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
                            placeholder="e.g. phone, country, zip_code, email"
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

                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) =>
                            updateGlobalField(idx, "value", e.target.value)
                          }
                          placeholder="Universal value or dynamic tags..."
                          className="styled-input"
                        />
                        <div className="flex flex-wrap gap-2">
                          {DYNAMIC_TAGS.map((dt) => (
                            <button
                              key={dt.tag}
                              className="tag-btn"
                              style={{ padding: "4px 10px" }}
                              onClick={() => injectTag(idx, dt.tag, true)}
                              title={`${dt.label}: ${dt.description}`}
                            >
                              <Plus size={12} /> {dt.shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card glass p-10 text-center">
                    <p style={{ color: "var(--text-muted)" }}>
                      No fields in "{currentEditingProfile.name}" yet. Add some
                      to build this profile!
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
                        Open any webpage with a form. Enable{" "}
                        <strong>Record Mode</strong> and submit the form, or
                        click <strong>Save Current</strong> in the popup.
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
                        Set <strong>Match Mode</strong> (Exact, Domain, or
                        Prefix), organize into <strong>Profiles</strong>, and
                        add dynamic tags.
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
                        Click any per-field sparkle icon to fill that field, or
                        use <strong>Command+Shift+A</strong> (Mac) /{" "}
                        <strong>Alt+Shift+A</strong> (Win) to fill the whole
                        form.
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
                  <div className="grid grid-cols-2 gap-4">
                    {DYNAMIC_TAGS.map((dt) => (
                      <div
                        key={dt.tag}
                        className="card"
                        style={{ padding: "16px" }}
                      >
                        <code
                          style={{
                            background: "var(--bg-color)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            color: "var(--accent)",
                            display: "inline-block",
                            marginBottom: "8px",
                            fontSize: "12px",
                          }}
                        >
                          {dt.tag}
                        </code>
                        <p style={{ fontSize: "13px", lineHeight: 1.5 }}>
                          {dt.description}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            marginTop: "6px",
                          }}
                        >
                          Example: <code>{dt.example}</code>
                        </p>
                      </div>
                    ))}
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
                Choose from the sidebar, click + to create one, or enable Record
                Mode to capture your first form.
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
