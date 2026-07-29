import React, { useEffect, useState } from "react";
import { ConfigManager, UserConfig } from "@off-ramp/core";
import { ExtensionStorage } from "../adapters/ExtensionStorage";

export default function Popup() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [accumulators, setAccumulators] = useState<Record<string, number>>({});
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const configManager = new ConfigManager();
  const storage = new ExtensionStorage();

  useEffect(() => {
    document.title = "Off-Ramp Toolbar Popup";
    loadConfig();
    loadAccumulators();

    // Auto-refresh accumulators every 1 second while popup is open
    const interval = setInterval(() => {
      loadAccumulators();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
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

  const saveConfig = async (newConfig: UserConfig) => {
    setConfig(newConfig);
    const serialized = configManager.serializeConfig(newConfig);
    await storage.save("off_ramp_config", serialized);
  };

  const handleExport = () => {
    if (!config) return;
    const jsonStr = configManager.serializeConfig(config);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "off_ramp_config.json";
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Config exported successfully!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = configManager.parseConfig(text);
        await saveConfig(parsed);
        setStatusMessage("Config imported successfully!");
        setTimeout(() => setStatusMessage(""), 3000);
      } catch (err) {
        setStatusMessage("Import failed: Invalid JSON file.");
        setTimeout(() => setStatusMessage(""), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenOptions = () => {
    if (typeof browser !== "undefined" && browser.runtime && browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  if (!config) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#94A3B8" }}>Loading Off-Ramp...</p>
      </div>
    );
  }

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
          <p style={styles.subtitle}>Opal-Style Focus Switcher</p>
          <button style={styles.buttonSettings} onClick={handleOpenOptions}>
            ⚙️ Settings & Rules
          </button>
        </div>
      </header>

      {statusMessage && <div style={styles.alertMessage}>{statusMessage}</div>}

      {/* Real-time Target Screen Time & Remaining Time Cards */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Monitored Websites & Time Remaining</h2>
        <div style={styles.targetList}>
          {config.targets
            .filter((t) => t.type === "website")
            .map((target) => {
              // Find rule applying to this target
              const matchingRule = config.rules.find(
                (r) => r.enabled && r.targetIds.includes(target.id)
              );

              const allowedMins = matchingRule ? matchingRule.allowedMinutes : 15;
              const accumulatedSecs = accumulators[target.identifier] || 0;
              const usedMins = accumulatedSecs / 60;
              const remainingMins = Math.max(0, allowedMins - usedMins);
              const percentUsed = Math.min(100, Math.max(0, (usedMins / allowedMins) * 100));

              const isNearLimit = percentUsed >= 85;

              return (
                <div key={target.id} style={styles.targetCardDetailed}>
                  <div style={styles.targetCardHeader}>
                    <div>
                      <span style={styles.targetName}>{target.name}</span>
                      <span style={styles.targetDomain}>{target.identifier}</span>
                    </div>

                    <span style={isNearLimit ? styles.badgeLimitNear : styles.badgeRemaining}>
                      {remainingMins === 0
                        ? "BREAK TRIGGERED"
                        : `${remainingMins.toFixed(1)} mins left`}
                    </span>
                  </div>

                  <div style={styles.progressTextRow}>
                    <span style={styles.progressText}>
                      Used: <strong>{usedMins.toFixed(1)}</strong> / {allowedMins} mins
                    </span>
                    <span style={styles.progressPercent}>{percentUsed.toFixed(0)}%</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={styles.progressBarTrack}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${percentUsed}%`,
                        backgroundColor: isNearLimit ? "#EF4444" : "#6366F1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Active Rules</h2>
        {config.rules.map((rule) => (
          <div key={rule.id} style={styles.ruleCard}>
            <p style={styles.ruleText}>
              Limit: <strong>{rule.allowedMinutes} mins</strong> | Break: <strong>{rule.interruptionSeconds}s</strong>
            </p>
            <p style={styles.ruleMessage}>"{rule.message}"</p>
          </div>
        ))}
      </div>

      <div style={styles.actionRow}>
        <button
          style={isMonitoring ? styles.buttonPause : styles.buttonActivate}
          onClick={() => setIsMonitoring(!isMonitoring)}>
          {isMonitoring ? "Pause Off-Ramp" : "Enable Off-Ramp"}
        </button>

        <button style={styles.buttonSecondary} onClick={handleExport}>
          Export JSON
        </button>

        <label style={styles.buttonSecondaryLabel}>
          Import JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "360px",
    padding: "20px",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    marginBottom: "16px",
    borderBottom: "1px solid #334155",
    paddingBottom: "12px",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#818CF8",
    margin: 0,
  },
  subtitle: {
    fontSize: "12px",
    color: "#94A3B8",
    marginTop: "4px",
    marginBottom: 0,
  },
  subHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },
  buttonSettings: {
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  badgeActive: {
    backgroundColor: "#065F46",
    color: "#34D399",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  badgeInactive: {
    backgroundColor: "#7F1D1D",
    color: "#F87171",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  alertMessage: {
    backgroundColor: "#312E81",
    color: "#C7D2FE",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    marginBottom: "14px",
    textAlign: "center",
  },
  section: {
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  targetList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  targetCardDetailed: {
    backgroundColor: "#1E293B",
    padding: "12px",
    borderRadius: "10px",
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
    fontSize: "14px",
    fontWeight: "700",
    color: "#F8FAFC",
  },
  targetDomain: {
    display: "block",
    fontSize: "11px",
    color: "#818CF8",
    marginTop: "1px",
  },
  badgeRemaining: {
    backgroundColor: "#312E81",
    color: "#C7D2FE",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "600",
  },
  badgeLimitNear: {
    backgroundColor: "#7F1D1D",
    color: "#F87171",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "700",
  },
  progressTextRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#94A3B8",
    marginBottom: "6px",
  },
  progressText: {
    color: "#CBD5E1",
  },
  progressPercent: {
    fontWeight: "700",
    color: "#F8FAFC",
  },
  progressBarTrack: {
    height: "6px",
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease, background-color 0.3s ease",
  },
  ruleCard: {
    backgroundColor: "#1E293B",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  ruleText: {
    fontSize: "13px",
    color: "#F8FAFC",
    margin: 0,
  },
  ruleMessage: {
    fontSize: "12px",
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: "4px",
    marginBottom: 0,
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    marginTop: "20px",
    flexWrap: "wrap",
  },
  buttonActivate: {
    flex: "1 1 100%",
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  buttonPause: {
    flex: "1 1 100%",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  buttonSecondary: {
    flex: "1",
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
  },
  buttonSecondaryLabel: {
    flex: "1",
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
    display: "inline-block",
  },
};
