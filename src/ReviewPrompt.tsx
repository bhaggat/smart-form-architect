import { useEffect, useState } from "react";
import { Star, X, ExternalLink } from "lucide-react";

const STORAGE_KEY = "reviewPromptState";
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

interface ReviewPromptState {
  installedAt: number;
  dismissedAt?: number;
  reviewed?: boolean;
  neverAsk?: boolean;
}

const RATING_LABELS = [
  "",
  "Needs work",
  "Could be better",
  "It's good",
  "Really like it!",
  "Love it!",
];

function getStoreReviewUrl(): string {
  const id =
    typeof chrome !== "undefined" && chrome.runtime?.id
      ? chrome.runtime.id
      : "";
  return id
    ? `https://chromewebstore.google.com/detail/${id}/reviews`
    : "https://chromewebstore.google.com/";
}

function isEligible(state: ReviewPromptState, now: number): boolean {
  if (state.reviewed || state.neverAsk) return false;
  if (now - state.installedAt < TEN_DAYS_MS) return false;
  if (state.dismissedAt && now - state.dismissedAt < SNOOZE_MS) return false;
  return true;
}

export default function ReviewPrompt() {
  const [visible, setVisible] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;

    chrome.storage.local.get(STORAGE_KEY, (res) => {
      const now = Date.now();
      const existing = res[STORAGE_KEY] as ReviewPromptState | undefined;

      if (!existing?.installedAt) {
        const initial: ReviewPromptState = { installedAt: now };
        chrome.storage.local.set({ [STORAGE_KEY]: initial });
        return;
      }

      if (isEligible(existing, now)) {
        setVisible(true);
      }
    });
  }, []);

  if (!visible) return null;

  const updateState = (patch: Partial<ReviewPromptState>) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(STORAGE_KEY, (res) => {
        const current = (res[STORAGE_KEY] as ReviewPromptState) || {
          installedAt: Date.now(),
        };
        chrome.storage.local.set({
          [STORAGE_KEY]: { ...current, ...patch },
        });
      });
    }
  };

  const handleReviewClick = (stars?: number) => {
    if (stars) setSelectedStar(stars);
    updateState({ reviewed: true });
    const url = getStoreReviewUrl();
    if (typeof chrome !== "undefined" && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    updateState({ dismissedAt: Date.now() });
    setVisible(false);
  };

  const handleNeverAsk = () => {
    updateState({ neverAsk: true });
    setVisible(false);
  };

  const activeStars = hoveredStar || selectedStar;

  return (
    <div
      className="card glass animate-fade-in"
      role="region"
      aria-label="Rate SmartForm Architect"
      style={{
        padding: "12px 14px",
        border: "1px solid rgba(88, 166, 255, 0.3)",
        background:
          "linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(48, 209, 88, 0.06) 100%)",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Remind me later"
        title="Remind me later"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} />
      </button>

      <div style={{ paddingRight: "20px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            marginBottom: "3px",
          }}
        >
          Enjoying SmartForm Architect?
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.4,
          }}
        >
          {activeStars > 0
            ? RATING_LABELS[activeStars]
            : "Tap a star to leave a quick review on Chrome Web Store."}
        </div>
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: "10px", gap: "8px" }}
      >
        <div
          className="flex items-center"
          style={{ gap: "4px" }}
          onMouseLeave={() => setHoveredStar(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= activeStars;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onClick={() => handleReviewClick(star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "2px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transform: filled ? "scale(1.12)" : "scale(1)",
                  transition: "transform 0.15s ease",
                }}
              >
                <Star
                  size={18}
                  color={filled ? "#f5b301" : "var(--text-muted)"}
                  fill={filled ? "#f5b301" : "transparent"}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => handleReviewClick()}
          style={{
            background: "var(--accent-gradient)",
            color: "#0d1117",
            border: "none",
            borderRadius: "8px",
            padding: "5px 10px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}
        >
          Review <ExternalLink size={11} />
        </button>
      </div>

      <div
        className="flex items-center justify-end"
        style={{ marginTop: "8px", gap: "12px" }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "10px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Maybe later
        </button>
        <button
          type="button"
          onClick={handleNeverAsk}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "10px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Don&apos;t ask again
        </button>
      </div>
    </div>
  );
}
