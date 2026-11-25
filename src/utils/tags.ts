export interface DynamicTagDefinition {
  tag: string;
  label: string;
  shortLabel: string;
  description: string;
  example: string;
}

export const DYNAMIC_TAGS: DynamicTagDefinition[] = [
  {
    tag: "{{timestamp}}",
    label: "Timestamp",
    shortLabel: "ts",
    description: "Current Unix timestamp in milliseconds.",
    example: "user+{{timestamp}}@example.com",
  },
  {
    tag: "{{autoIncrement}}",
    label: "Auto Increment",
    shortLabel: "inc",
    description: "Number that increments by +1 on each autofill.",
    example: "qa-user-{{autoIncrement}}",
  },
  {
    tag: "{{date}}",
    label: "Current Date",
    shortLabel: "date",
    description: "Today's date in YYYY-MM-DD format.",
    example: "{{date}}",
  },
  {
    tag: "{{time}}",
    label: "Current Time",
    shortLabel: "time",
    description: "Current local time in HH:MM:SS format.",
    example: "{{time}}",
  },
  {
    tag: "{{uuid}}",
    label: "UUID v4",
    shortLabel: "uuid",
    description: "Randomly generated universally unique identifier.",
    example: "{{uuid}}",
  },
  {
    tag: "{{randomEmail}}",
    label: "Random Email",
    shortLabel: "email",
    description: "Generates a unique random email address.",
    example: "{{randomEmail}}",
  },
  {
    tag: "{{randomString:8}}",
    label: "Random String",
    shortLabel: "str",
    description: "Random alphanumeric string of length N (e.g. :8).",
    example: "ref-{{randomString:6}}",
  },
  {
    tag: "{{randomNumber:1000:9999}}",
    label: "Random Number",
    shortLabel: "num",
    description: "Random integer between min and max (inclusive).",
    example: "{{randomNumber:1000:9999}}",
  },
];

function randomAlphanumeric(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Resolves all dynamic template tags in a field value.
 */
export async function parseDynamicTags(
  rawValue: string,
  getAutoIncrement: () => Promise<number>,
): Promise<string> {
  let val = rawValue;

  if (val.includes("{{timestamp}}")) {
    val = val.replace(/\{\{timestamp\}\}/g, Date.now().toString());
  }

  if (val.includes("{{autoIncrement}}")) {
    const inc = await getAutoIncrement();
    val = val.replace(/\{\{autoIncrement\}\}/g, String(inc));
  }

  if (val.includes("{{date}}")) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    val = val.replace(/\{\{date\}\}/g, `${yyyy}-${mm}-${dd}`);
  }

  if (val.includes("{{time}}")) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const sec = String(now.getSeconds()).padStart(2, "0");
    val = val.replace(/\{\{time\}\}/g, `${hh}:${min}:${sec}`);
  }

  if (val.includes("{{uuid}}")) {
    val = val.replace(/\{\{uuid\}\}/g, () => generateUuid());
  }

  if (val.includes("{{randomEmail}}")) {
    val = val.replace(
      /\{\{randomEmail\}\}/g,
      () => `user.${randomAlphanumeric(6)}@example.com`,
    );
  }

  if (val.includes("{{randomString")) {
    val = val.replace(/\{\{randomString(?::(\d+))?\}\}/g, (_m, lenStr) => {
      const len = Math.min(Math.max(parseInt(lenStr || "8", 10) || 8, 1), 64);
      return randomAlphanumeric(len);
    });
  }

  if (val.includes("{{randomNumber")) {
    val = val.replace(
      /\{\{randomNumber(?::(\d+):(\d+))?\}\}/g,
      (_m, minStr, maxStr) => {
        const min = parseInt(minStr || "1000", 10);
        const max = parseInt(maxStr || "9999", 10);
        const lo = Math.min(min, max);
        const hi = Math.max(min, max);
        return String(Math.floor(Math.random() * (hi - lo + 1)) + lo);
      },
    );
  }

  return val;
}
