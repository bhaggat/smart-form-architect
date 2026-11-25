export type MatchMode = "exact" | "domain" | "prefix";

export interface FormField {
  id: string;
  name: string;
  placeholder: string;
  type: string;
  value: string;
}

export interface TemplateData {
  url: string;
  name?: string;
  matchMode?: MatchMode;
  category?: string;
  updatedAt?: number;
  fields: FormField[];
}

export type TemplatesMap = Record<string, TemplateData>;

export interface Profile {
  id: string;
  name: string;
  fields: FormField[];
}

export interface ExtensionSettings {
  recordMode: boolean;
  enablePerField: boolean;
  enablePerPage: boolean;
  enableShortcut: boolean;
  customShortcut: string;
  autoFillOnLoad: boolean;
  autoFillDelay: number;
  skipFilledFields: boolean;
  excludePasswords: boolean;
  excludedDomains: string[];
  accentColor: string;
}

export const DEFAULT_ACCENT_COLOR = "#58a6ff";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  recordMode: false,
  enablePerField: true,
  enablePerPage: false,
  enableShortcut: true,
  customShortcut: "Alt+Shift+A",
  autoFillOnLoad: false,
  autoFillDelay: 800,
  skipFilledFields: false,
  excludePasswords: true,
  excludedDomains: [],
  accentColor: DEFAULT_ACCENT_COLOR,
};
