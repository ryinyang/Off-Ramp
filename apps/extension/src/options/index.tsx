import React, { useEffect, useState } from "react";
import { ConfigManager, UserConfig, Rule, Target, DomainUtils } from "@off-ramp/core";
import { ExtensionStorage } from "../adapters/ExtensionStorage";

export default function Options() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  // Edit / Create Rule Form state
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // New Target Form state
  const [newTargetName, setNewTargetName] = useState("");
  const [newTargetDomain, setNewTargetDomain] = useState("");
  const [isAddingTarget, setIsAddingTarget] = useState(false);

  const storage = new ExtensionStorage();
  const configManager = new ConfigManager();

  useEffect(() => {
    document.title = "Off-Ramp Settings & Rule Configurator";
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const storedJson = await storage.load("off_ramp_config");
    if (storedJson) {
      try {
        const parsed = configManager.parseConfig(storedJson);
        setConfig(parsed);
        return;
      } catch (e) {
        console.error("[Off-Ramp] Config parse error:", e);
      }
    }
    const defaultConfig = ConfigManager.createDefaultConfig();
    setConfig(defaultConfig);
  };

  const saveConfig = async (newConfig: UserConfig) => {
    setConfig(newConfig);
    const serialized = configManager.serializeConfig(newConfig);
    await storage.save("off_ramp_config", serialized);
    showStatus("Settings saved successfully!");
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3500);
  };

  // --- Target Management Handlers ---
  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newTargetName.trim() || !newTargetDomain.trim()) return;

    const cleanedDomain = DomainUtils.normalizeDomain(newTargetDomain);

    const newTarget: Target = {
      id: `target-${Date.now()}`,
      name: newTargetName.trim(),
      identifier: cleanedDomain,
      type: "website",
    };

    const updatedConfig: UserConfig = {
      ...config,
      targets: [...config.targets, newTarget],
      updatedAt: new Date().toISOString(),
    };

    await saveConfig(updatedConfig);
    setNewTargetName("");
    setNewTargetDomain("");
    setIsAddingTarget(false);
  };

  const handleRemoveTarget = async (targetId: string) => {
    if (!config) return;
    const updatedConfig: UserConfig = {
      ...config,
      targets: config.targets.filter((t) => t.id !== targetId),
      rules: config.rules.map((r) => ({
        ...r,
        targetIds: r.targetIds.filter((id) => id !== targetId),
      })),
      updatedAt: new Date().toISOString(),
    };
    await saveConfig(updatedConfig);
  };

  // --- Rule Management Handlers ---
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !editingRule) return;

    let updatedRules: Rule[];
    if (isCreatingRule) {
      updatedRules = [...config.rules, editingRule];
    } else {
      updatedRules = config.rules.map((r) => (r.id === editingRule.id ? editingRule : r));
    }

    const updatedConfig: UserConfig = {
      ...config,
      rules: updatedRules,
      updatedAt: new Date().toISOString(),
    };

    await saveConfig(updatedConfig);
    setEditingRule(null);
    setIsCreatingRule(false);
  };

  const handleToggleRule = async (ruleId: string) => {
    if (!config) return;
    const updatedRules = config.rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    await saveConfig({
      ...config,
      rules: updatedRules,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!config) return;
    const updatedConfig: UserConfig = {
      ...config,
      rules: config.rules.filter((r) => r.id !== ruleId),
      updatedAt: new Date().toISOString(),
    };
    await saveConfig(updatedConfig);
  };

  const startCreateRule = () => {
    if (!config || config.schedules.length === 0) return;
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      allowedMinutes: 15,
      interruptionSeconds: 30,
      message: "Hey! Time to take a break and give yourself an off-ramp.",
      targetIds: config.targets.map((t) => t.id),
      scheduleId: config.schedules[0].id,
      enabled: true,
    };
    setEditingRule(newRule);
    setIsCreatingRule(true);
  };

  // --- Clipboard Config Export / Import ---
  const handleExportJson = async () => {
    if (!config) return;
    try {
      const jsonStr = configManager.serializeConfig(config);
      await navigator.clipboard.writeText(jsonStr);
      showStatus("Configuration copied to clipboard! 📋");
    } catch (_err) {
      showStatus("Failed to copy to clipboard.");
    }
  };

  const handleImportJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        showStatus("Clipboard is empty.");
        return;
      }
      const parsed = configManager.parseConfig(text);
      await saveConfig(parsed);
      showStatus("Imported configuration from clipboard! 🚀");
    } catch (_err) {
      showStatus("Import failed: Invalid JSON format on clipboard.");
    }
  };

  if (!config) {
    return (
      <div style={styles.fullscreenContainer}>
        <p style={{ color: "#94A3B8" }}>Loading Off-Ramp Settings...</p>
      </div>
    );
  }

  return (
    <div style={styles.fullscreenContainer}>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #0F172A !important;
          border: none !important;
        }
      `}</style>
      <div style={styles.pageCard}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>🛑 Off-Ramp Settings & Rule Configurator</h1>
            <p style={styles.pageSubtitle}>
              Configure your screen time limits, target websites, break durations, and reflection
              messages.
            </p>
          </div>
        </header>

        {statusMessage && <div style={styles.statusToast}>{statusMessage}</div>}

        {/* Section 1: Target Websites */}
        <section style={styles.section}>
          <div style={styles.sectionHeaderRow}>
            <h2 style={styles.sectionTitle}>🌐 Monitored Websites</h2>
            <button
              style={styles.buttonPrimarySmall}
              onClick={() => setIsAddingTarget(!isAddingTarget)}
            >
              {isAddingTarget ? "Cancel" : "+ Add Website Target"}
            </button>
          </div>

          {isAddingTarget && (
            <form onSubmit={handleAddTarget} style={styles.inlineForm}>
              <input
                type="text"
                placeholder="Website Name (e.g. YouTube)"
                value={newTargetName}
                onChange={(e) => setNewTargetName(e.target.value)}
                style={styles.inputField}
                required
              />
              <input
                type="text"
                placeholder="Domain (e.g. youtube.com)"
                value={newTargetDomain}
                onChange={(e) => setNewTargetDomain(e.target.value)}
                style={styles.inputField}
                required
              />
              <button type="submit" style={styles.buttonSaveSmall}>
                Save Target
              </button>
            </form>
          )}

          <div style={styles.gridList}>
            {config.targets.map((target) => (
              <div key={target.id} style={styles.targetGridCard}>
                <div>
                  <span style={styles.targetName}>{target.name}</span>
                  <span style={styles.targetIdentifier}>{target.identifier}</span>
                </div>
                <button
                  style={styles.buttonDangerIcon}
                  title="Remove Target"
                  onClick={() => handleRemoveTarget(target.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Rule Management */}
        <section style={styles.section}>
          <div style={styles.sectionHeaderRow}>
            <h2 style={styles.sectionTitle}>⚙️ Interruption Rules</h2>
            <button style={styles.buttonPrimarySmall} onClick={startCreateRule}>
              + Create New Rule
            </button>
          </div>

          <div style={styles.ruleStack}>
            {config.rules.map((rule) => (
              <div key={rule.id} style={styles.ruleCardItem}>
                <div style={styles.ruleTopRow}>
                  <div style={styles.ruleTitleGroup}>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      style={styles.checkbox}
                    />
                    <span style={rule.enabled ? styles.ruleNameActive : styles.ruleNameDisabled}>
                      Rule (Allowed: {rule.allowedMinutes} mins | Break: {rule.interruptionSeconds}
                      s)
                    </span>
                  </div>

                  <div style={styles.ruleActionButtons}>
                    <button
                      style={styles.buttonEdit}
                      onClick={() => {
                        setEditingRule(rule);
                        setIsCreatingRule(false);
                      }}
                    >
                      Edit
                    </button>
                    <button style={styles.buttonDelete} onClick={() => handleDeleteRule(rule.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <p style={styles.ruleMsgPreview}>"{rule.message}"</p>

                <div style={styles.tagRow}>
                  <span style={styles.tagLabel}>Assigned Targets:</span>
                  {rule.targetIds.length === 0 ? (
                    <span style={styles.tagEmpty}>No targets assigned</span>
                  ) : (
                    rule.targetIds.map((tid) => {
                      const t = config.targets.find((target) => target.id === tid);
                      return (
                        <span key={tid} style={styles.targetTag}>
                          {t ? t.name : tid}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Edit / Create Rule Modal */}
        {editingRule && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>
                {isCreatingRule ? "Create New Rule" : "Edit Interruption Rule"}
              </h3>

              <form onSubmit={handleSaveRule} style={styles.formContainer}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Allowed Screen Time (Minutes):</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={editingRule.allowedMinutes}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        allowedMinutes: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    style={styles.inputField}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Break Duration (Seconds):</label>
                  <input
                    type="number"
                    min="5"
                    max="3600"
                    value={editingRule.interruptionSeconds}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        interruptionSeconds: parseInt(e.target.value, 10) || 5,
                      })
                    }
                    style={styles.inputField}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Custom Reflection Message:</label>
                  <input
                    type="text"
                    value={editingRule.message}
                    onChange={(e) => setEditingRule({ ...editingRule, message: e.target.value })}
                    style={styles.inputField}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Target Websites Included:</label>
                  <div style={styles.targetCheckboxesList}>
                    {config.targets.map((t) => {
                      const isChecked = editingRule.targetIds.includes(t.id);
                      return (
                        <label key={t.id} style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingRule({
                                  ...editingRule,
                                  targetIds: [...editingRule.targetIds, t.id],
                                });
                              } else {
                                setEditingRule({
                                  ...editingRule,
                                  targetIds: editingRule.targetIds.filter((id) => id !== t.id),
                                });
                              }
                            }}
                          />
                          {t.name} ({t.identifier})
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.modalButtonRow}>
                  <button type="submit" style={styles.buttonSaveModal}>
                    Save Rule Changes
                  </button>
                  <button
                    type="button"
                    style={styles.buttonCancelModal}
                    onClick={() => {
                      setEditingRule(null);
                      setIsCreatingRule(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Section 3: Data Backup & Sync */}
        <section style={styles.sectionFooter}>
          <h2 style={styles.sectionTitle}>📦 Configuration Backup & Sync</h2>
          <div style={styles.backupRow}>
            <button style={styles.buttonSecondary} onClick={handleExportJson}>
              📋 Copy Config to Clipboard
            </button>
            <button style={styles.buttonSecondary} onClick={handleImportJson}>
              📥 Paste Config from Clipboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullscreenContainer: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "40px 20px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
  },
  pageCard: {
    maxWidth: "800px",
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #334155",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  header: {
    borderBottom: "1px solid #334155",
    paddingBottom: "20px",
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#818CF8",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#94A3B8",
    marginTop: "6px",
    marginBottom: 0,
  },
  statusToast: {
    backgroundColor: "#312E81",
    color: "#C7D2FE",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "20px",
    textAlign: "center",
  },
  section: {
    marginBottom: "32px",
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#F8FAFC",
    margin: 0,
  },
  buttonPrimarySmall: {
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  inlineForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    backgroundColor: "#0F172A",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  inputField: {
    flex: "1",
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
    border: "1px solid #475569",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
  },
  buttonSaveSmall: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  gridList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "12px",
  },
  targetGridCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  targetName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#F8FAFC",
  },
  targetIdentifier: {
    display: "block",
    fontSize: "12px",
    color: "#818CF8",
    marginTop: "2px",
  },
  buttonDangerIcon: {
    backgroundColor: "transparent",
    color: "#EF4444",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "4px 8px",
  },
  ruleStack: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  ruleCardItem: {
    backgroundColor: "#0F172A",
    borderRadius: "10px",
    padding: "16px",
    border: "1px solid #334155",
  },
  ruleTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ruleTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  ruleNameActive: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#F8FAFC",
  },
  ruleNameDisabled: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#64748B",
    textDecoration: "line-through",
  },
  ruleActionButtons: {
    display: "flex",
    gap: "8px",
  },
  buttonEdit: {
    backgroundColor: "#334155",
    color: "#818CF8",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  buttonDelete: {
    backgroundColor: "#451A1A",
    color: "#F87171",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  ruleMsgPreview: {
    fontSize: "13px",
    color: "#CBD5E1",
    fontStyle: "italic",
    margin: "10px 0",
  },
  tagRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  tagLabel: {
    fontSize: "12px",
    color: "#64748B",
  },
  tagEmpty: {
    fontSize: "12px",
    color: "#94A3B8",
    fontStyle: "italic",
  },
  targetTag: {
    backgroundColor: "#312E81",
    color: "#C7D2FE",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: "14px",
    padding: "28px",
    maxWidth: "500px",
    width: "100%",
    border: "1px solid #475569",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#818CF8",
    margin: "0 0 20px 0",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#CBD5E1",
  },
  targetCheckboxesList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    backgroundColor: "#0F172A",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    maxHeight: "140px",
    overflowY: "auto",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#F8FAFC",
    cursor: "pointer",
  },
  modalButtonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  buttonSaveModal: {
    flex: "1",
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  buttonCancelModal: {
    flex: "1",
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sectionFooter: {
    borderTop: "1px solid #334155",
    paddingTop: "20px",
  },
  backupRow: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  buttonSecondary: {
    flex: "1",
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
  },
  buttonSecondaryLabel: {
    flex: "1",
    backgroundColor: "#334155",
    color: "#F8FAFC",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
    display: "inline-block",
  },
};
