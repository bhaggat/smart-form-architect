import {
  DEFAULT_ACCENT_COLOR,
  type FormField,
  type Profile,
  type TemplateData,
  type TemplatesMap,
} from "../types/storage";

export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

export function normalizeUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}

export function isDomainExcluded(
  url: string,
  excludedDomains: string[] = [],
): boolean {
  if (!excludedDomains || excludedDomains.length === 0) return false;
  const host = safeHostname(url).toLowerCase();
  return excludedDomains.some((entry) => {
    const clean = entry.trim().toLowerCase();
    if (!clean) return false;
    return host === clean || host.endsWith(`.${clean}`);
  });
}

/**
 * Finds the best matching template for a given page URL.
 * Priority:
 * 1. Exact URL key match
 * 2. Prefix / wildcard match (longest prefix wins)
 * 3. Domain / hostname match
 */
export function findMatchingTemplate(
  templates: TemplatesMap | undefined,
  currentUrl: string,
): TemplateData | null {
  if (!templates) return null;

  const normalized = normalizeUrlKey(currentUrl);
  if (templates[normalized] && (templates[normalized].matchMode || "exact") === "exact") {
    return templates[normalized];
  }
  if (templates[currentUrl] && (templates[currentUrl].matchMode || "exact") === "exact") {
    return templates[currentUrl];
  }

  const currentHost = safeHostname(currentUrl).toLowerCase();
  let bestPrefixMatch: TemplateData | null = null;
  let bestPrefixLen = -1;
  let domainMatch: TemplateData | null = null;

  for (const [key, tpl] of Object.entries(templates)) {
    const mode = tpl.matchMode || "exact";
    if (mode === "exact") {
      if (key === normalized || key === currentUrl) {
        return tpl;
      }
      continue;
    }

    if (mode === "prefix") {
      const prefix = key.replace(/\*+$/, "");
      if (
        (normalized.startsWith(prefix) || currentUrl.startsWith(prefix)) &&
        prefix.length > bestPrefixLen
      ) {
        bestPrefixLen = prefix.length;
        bestPrefixMatch = tpl;
      }
      continue;
    }

    if (mode === "domain") {
      const tplHost = safeHostname(key).toLowerCase();
      if (tplHost && tplHost === currentHost) {
        domainMatch = tpl;
      }
    }
  }

  return bestPrefixMatch || domainMatch || templates[normalized] || null;
}

export function applyAccentTheme(color?: string): void {
  const accent = color || DEFAULT_ACCENT_COLOR;
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-hover", accent);
  }
}

export function resolveProfilesFromStorage(res: {
  profiles?: Profile[];
  activeProfileId?: string;
  globalFields?: FormField[];
}): { profiles: Profile[]; activeProfileId: string } {
  if (Array.isArray(res.profiles) && res.profiles.length > 0) {
    const activeId =
      res.activeProfileId && res.profiles.some((p) => p.id === res.activeProfileId)
        ? res.activeProfileId
        : res.profiles[0].id;
    return { profiles: res.profiles, activeProfileId: activeId };
  }

  // Migrate legacy globalFields into a default Personal profile
  const defaultProfile: Profile = {
    id: "default",
    name: "Personal",
    fields: Array.isArray(res.globalFields) ? res.globalFields : [],
  };
  return { profiles: [defaultProfile], activeProfileId: "default" };
}
