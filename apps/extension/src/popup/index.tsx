import React, { useEffect, useState } from "react";
import { ConfigManager, UserConfig, TimeUtils, ScheduleEvaluator } from "@off-ramp/core";
import { ExtensionStorage } from "../adapters/ExtensionStorage";
import { BrowserApi } from "../utils/BrowserApi";

const REQUIRED_PHRASE = "I am choosing to pause Off-Ramp";

const configManager = new ConfigManager();
const storage = new ExtensionStorage();

export default function Popup() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [accumulators, setAccumulators] = useState<Record<string, number>>({});
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  // Mindful Pause Modal state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [typedPhrase, setTypedPhrase] = useState("");

  useEffect(() => {
    document.title = "Off-Ramp Toolbar Popup";

    const loadConfig = async () => {
      const pausedVal = await storage.load("off_ramp_paused");

      setIsMonitoring(pausedVal !== "true");

      const storedJson = await storage.load("off_ramp_config");
      if (storedJson) {
        try {
          const parsed = configManager.parseConfig(storedJson);
          setConfig(parsed);
          return;
        } catch (e) {
          console.error("Config parse failed:", e);
        }
      }
      const defaultConfig = ConfigManager.createDefaultConfig();
      setConfig(defaultConfig);
    };

    const loadAccumulators = async () => {
      const json = await storage.load("off_ramp_accumulators");
      if (json) {
        try {
          setAccumulators(JSON.parse(json));
        } catch {
          // Ignore JSON parse error
        }
      }
    };

    loadConfig();
    loadAccumulators();

    // Auto-refresh accumulators every 1 second while popup is open
    const interval = setInterval(() => {
      loadAccumulators();
      loadConfig();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getSessionEndInfo = (): { endMs: number; timeStr: string } => {
    const now = new Date();
    let latestEndMs = 0;
    let timeStr = "23:59";

    if (config && config.schedules) {
      const evaluator = new ScheduleEvaluator();
      for (const schedule of config.schedules) {
        if (evaluator.isMonitoringActive(schedule, now)) {
          const [endHour, endMin] = schedule.endTime.split(":").map(Number);
          const endDate = new Date(now);
          endDate.setHours(endHour, endMin, 0, 0);
          const endMs = endDate.getTime();
          if (endMs > latestEndMs) {
            latestEndMs = endMs;
            timeStr = schedule.endTime;
          }
        }
      }
    }

    if (latestEndMs === 0) {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      latestEndMs = endOfDay.getTime();
      timeStr = "23:59";
    }

    return { endMs: latestEndMs, timeStr };
  };

  const handleInitiatePause = () => {
    if (!isMonitoring) {
      // Already paused -> Resume instantly
      handleUnpause();
    } else {
      // Currently active -> Open Mindful Pause modal requiring typed phrase
      setTypedPhrase("");
      setShowPauseModal(true);
    }
  };

  const handleConfirmPause = async () => {
    if (typedPhrase.trim() !== REQUIRED_PHRASE) return;

    const { endMs } = getSessionEndInfo();
    setIsMonitoring(false);
    setShowPauseModal(false);

    await storage.save("off_ramp_paused", "true");
    await storage.save("off_ramp_paused_until", String(endMs));

    setStatusMessage("Off-Ramp paused until end of session!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleUnpause = async () => {
    setIsMonitoring(true);

    await storage.save("off_ramp_paused", "false");
    await storage.save("off_ramp_paused_until", "");

    setStatusMessage("Off-Ramp monitoring resumed! 🛡️");
    setTimeout(() => setStatusMessage(""), 2500);
  };

  const saveConfig = async (newConfig: UserConfig) => {
    setConfig(newConfig);
    const serialized = configManager.serializeConfig(newConfig);
    await storage.save("off_ramp_config", serialized);
  };

  const handleExport = async () => {
    if (!config) return;
    try {
      const jsonStr = configManager.serializeConfig(config);
      await navigator.clipboard.writeText(jsonStr);
      setStatusMessage("Config copied to clipboard! 📋");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      setStatusMessage("Failed to copy to clipboard.");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setStatusMessage("Clipboard is empty.");
        setTimeout(() => setStatusMessage(""), 3000);
        return;
      }
      const parsed = configManager.parseConfig(text);
      await saveConfig(parsed);
      setStatusMessage("Config pasted & imported! 🚀");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      setStatusMessage("Import failed: Invalid JSON on clipboard.");
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleOpenOptions = () => {
    BrowserApi.openOptionsPage();
  };

  if (!config) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#94A3B8" }}>Loading Off-Ramp...</p>
      </div>
    );
  }

  const { timeStr: activeSessionEndStr } = getSessionEndInfo();
  const isPhraseMatched = typedPhrase.trim() === REQUIRED_PHRASE;

  return (
    <div style={styles.container}>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #0F172A !important;
          border: none !important;
        }
      `}</style>
      <header style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Off-Ramp</h1>
          <span style={isMonitoring ? styles.badgeActive : styles.badgeInactive}>
            {isMonitoring ? "ACTIVE" : "PAUSED"}
          </span>
        </div>
        <div style={styles.subHeaderRow}>
          <p style={styles.subtitle}>Doomscrolling Interrupter & Focus Switcher</p>
          <button style={styles.buttonSettings} onClick={handleOpenOptions}>
            ⚙️ Settings & Rules
          </button>
        </div>
      </header>

      {statusMessage && <div style={styles.alertMessage}>{statusMessage}</div>}

      {/* Real-time Rule-Level Screen Time & Remaining Time Cards */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Active Rules & Screen Time Remaining</h2>
        <div style={styles.targetList}>
          {config.rules.map((rule) => {
            const accumulatedSecs = accumulators[rule.id] || 0;
            const { usedMinutes, remainingMinutes, percentUsed, isNearLimit } =
              TimeUtils.calculateRuleTime(rule.allowedMinutes, accumulatedSecs);

            const assignedTargetNames = config.targets
              .filter((t) => rule.targetIds.includes(t.id))
              .map((t) => t.name)
              .join(", ");

            return (
              <div key={rule.id} style={styles.targetCardDetailed}>
                <div style={styles.targetCardHeader}>
                  <div>
                    <span style={styles.targetName}>
                      Limit: {rule.allowedMinutes} mins | Break: {rule.interruptionSeconds}s
                    </span>
                    <span style={styles.targetDomain}>
                      Targets: {assignedTargetNames || "None"}
                    </span>
                  </div>

                  <span
                    style={
                      !isMonitoring
                        ? styles.badgePaused
                        : isNearLimit
                        ? styles.badgeLimitNear
                        : styles.badgeRemaining
                    }>
                    {!isMonitoring
                      ? "PAUSED ⏸️"
                      : remainingMinutes === 0
                      ? "BREAK TRIGGERED"
                      : `${remainingMinutes.toFixed(1)} mins left`}
                  </span>
                </div>

                <div style={styles.progressTextRow}>
                  <span style={styles.progressText}>
                    Combined Used: <strong>{usedMinutes.toFixed(1)}</strong> / {rule.allowedMinutes} mins
                  </span>
                  <span style={styles.progressPercent}>{percentUsed.toFixed(0)}%</span>
                </div>

                {/* Visual Progress Bar */}
                <div style={styles.progressBarTrack}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${percentUsed}%`,
                      backgroundColor: !isMonitoring
                        ? "#64748B"
                        : isNearLimit
                        ? "#EF4444"
                        : "#6366F1",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.actionRow}>
        <button
          style={isMonitoring ? styles.buttonPauseFriction : styles.buttonResumeActive}
          onClick={handleInitiatePause}>
          {isMonitoring ? "Pause Off-Ramp (Requires Reflection)" : "Resume Monitoring Now 🛡️"}
        </button>
      </div>

      <div style={styles.clipboardRow}>
        <button style={styles.buttonClipboard} onClick={handleExport}>
          📋 Copy Config
        </button>
        <button style={styles.buttonClipboard} onClick={handleImport}>
          📥 Paste Config
        </button>
      </div>

      {/* Mindful Pause Modal Overlay */}
      {showPauseModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Mindful Pause Request ⏸️</h3>
            <p style={styles.modalDescription}>
              Pausing Off-Ramp requires intentional friction to prevent impulse doomscrolling.
            </p>
            <p style={styles.modalSessionInfo}>
              Pause will stay active until the end of this session (<strong>{activeSessionEndStr}</strong>).
            </p>

            <div style={styles.phrasePromptBox}>
              <span style={styles.phraseLabel}>Type the phrase below to unlock pause:</span>
              <span style={styles.phraseRequired}>"{REQUIRED_PHRASE}"</span>
            </div>

            <input
              type="text"
              style={styles.modalInput}
              placeholder={`Type "${REQUIRED_PHRASE}"`}
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              autoFocus
            />

            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalButtonCancel}
                onClick={() => setShowPauseModal(false)}>
                Cancel
              </button>
              <button
                style={
                  isPhraseMatched
                    ? styles.modalButtonConfirmActive
                    : styles.modalButtonConfirmDisabled
                }
                disabled={!isPhraseMatched}
                onClick={handleConfirmPause}>
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "360px",
    padding: "16px",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
    position: "relative",
  },
  header: {
    marginBottom: "16px",
    borderBottom: "1px solid #1E293B",
    paddingBottom: "12px",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
    color: "#6366F1",
  },
  subHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "6px",
  },
  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    margin: 0,
  },
  buttonSettings: {
    backgroundColor: "#1E293B",
    color: "#E2E8F0",
    border: "1px solid #334155",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
    fontWeight: 600,
  },
  badgeActive: {
    backgroundColor: "#10B981",
    color: "#064E3B",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "12px",
  },
  badgeInactive: {
    backgroundColor: "#EF4444",
    color: "#7F1D1D",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "12px",
  },
  alertMessage: {
    backgroundColor: "#1E1B4B",
    color: "#818CF8",
    border: "1px solid #3730A3",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    marginBottom: "12px",
    textAlign: "center",
  },
  section: {
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  targetList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  targetCardDetailed: {
    backgroundColor: "#1E293B",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  targetCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  targetName: {
    display: "block",
    fontWeight: "bold",
    fontSize: "13px",
    color: "#F8FAFC",
  },
  targetDomain: {
    display: "block",
    fontSize: "11px",
    color: "#94A3B8",
  },
  badgeRemaining: {
    backgroundColor: "#312E81",
    color: "#A5B4FC",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  badgeLimitNear: {
    backgroundColor: "#7F1D1D",
    color: "#FCA5A5",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  badgePaused: {
    backgroundColor: "#334155",
    color: "#94A3B8",
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  progressTextRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: "#94A3B8",
    marginBottom: "4px",
  },
  progressText: {
    color: "#CBD5E1",
  },
  progressPercent: {
    fontWeight: "bold",
    color: "#818CF8",
  },
  progressBarTrack: {
    height: "6px",
    backgroundColor: "#0F172A",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  actionRow: {
    marginBottom: "12px",
  },
  buttonPauseFriction: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#475569",
    color: "#F8FAFC",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonResumeActive: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#10B981",
    color: "#064E3B",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  clipboardRow: {
    display: "flex",
    gap: "8px",
  },
  buttonClipboard: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#1E293B",
    color: "#94A3B8",
    border: "1px solid #334155",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  modalTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#F8FAFC",
    margin: "0 0 6px 0",
  },
  modalDescription: {
    fontSize: "12px",
    color: "#94A3B8",
    margin: "0 0 8px 0",
    lineHeight: "1.4",
  },
  modalSessionInfo: {
    fontSize: "12px",
    color: "#818CF8",
    margin: "0 0 12px 0",
  },
  phrasePromptBox: {
    backgroundColor: "#0F172A",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    marginBottom: "10px",
  },
  phraseLabel: {
    display: "block",
    fontSize: "11px",
    color: "#94A3B8",
    marginBottom: "4px",
  },
  phraseRequired: {
    display: "block",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#F43F5E",
    fontFamily: "monospace",
  },
  modalInput: {
    width: "100%",
    padding: "8px 10px",
    backgroundColor: "#0F172A",
    border: "1px solid #475569",
    borderRadius: "6px",
    color: "#F8FAFC",
    fontSize: "12px",
    marginBottom: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  modalButtonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  modalButtonCancel: {
    padding: "8px 12px",
    backgroundColor: "#334155",
    color: "#E2E8F0",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  modalButtonConfirmDisabled: {
    padding: "8px 12px",
    backgroundColor: "#475569",
    color: "#94A3B8",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  modalButtonConfirmActive: {
    padding: "8px 12px",
    backgroundColor: "#F43F5E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
