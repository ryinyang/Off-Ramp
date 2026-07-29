import React, { useEffect, useState } from "react";

export default function BreakPage() {
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [message, setMessage] = useState<string>(
    "Time to take a break! Give yourself an off-ramp."
  );

  useEffect(() => {
    document.title = "Off-Ramp Break Screen ⏱️";
    const params = new URLSearchParams(window.location.search);
    const durationParam = params.get("duration");
    const messageParam = params.get("message");

    if (durationParam) {
      const parsedDuration = parseInt(durationParam, 10);
      if (!isNaN(parsedDuration) && parsedDuration > 0) {
        setTimeLeft(parsedDuration);
      }
    }

    if (messageParam) {
      setMessage(decodeURIComponent(messageParam));
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Timer finished - DO NOT auto-redirect. Stop timer at 0.
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const isBreakActive = timeLeft > 0;

  return (
    <div style={styles.fullscreenContainer}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>{isBreakActive ? "⏱️" : "🎉"}</div>
        <h1 style={styles.title}>
          {isBreakActive ? "Off-Ramp Active" : "Break Complete!"}
        </h1>
        <p style={styles.message}>"{message}"</p>

        <div
          style={{
            ...styles.timerCircle,
            borderColor: isBreakActive ? "#6366F1" : "#10B981",
            backgroundColor: isBreakActive ? "#312E81" : "#065F46",
          }}>
          <span style={styles.timerNumber}>{timeLeft}</span>
          <span style={styles.timerLabel}>
            {isBreakActive ? "seconds remaining" : "seconds left"}
          </span>
        </div>

        <p style={styles.subtext}>
          {isBreakActive
            ? "Take a deep breath. Focus on your real-world priorities."
            : "Your break time is complete. You may now return to your page or continue your day."}
        </p>

        <button
          style={isBreakActive ? styles.buttonDisabled : styles.buttonEnabled}
          disabled={isBreakActive}
          onClick={() => window.history.back()}>
          {isBreakActive
            ? `Return Available in ${timeLeft}s`
            : "End Break & Return"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullscreenContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "500px",
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: "16px",
    padding: "40px 30px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
    border: "1px solid #334155",
    textAlign: "center",
  },
  iconCircle: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#818CF8",
    margin: "0 0 12px 0",
  },
  message: {
    fontSize: "16px",
    color: "#E2E8F0",
    fontStyle: "italic",
    margin: "0 0 24px 0",
    lineHeight: "1.5",
  },
  timerCircle: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    border: "4px solid #6366F1",
    marginBottom: "24px",
    transition: "all 0.3s ease",
  },
  timerNumber: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#F8FAFC",
  },
  timerLabel: {
    fontSize: "10px",
    color: "#C7D2FE",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: "2px",
  },
  subtext: {
    fontSize: "14px",
    color: "#94A3B8",
    margin: "0 0 24px 0",
    lineHeight: "1.5",
  },
  buttonEnabled: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    border: "none",
    padding: "14px 28px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    transition: "transform 0.1s ease, background-color 0.2s ease",
  },
  buttonDisabled: {
    backgroundColor: "#334155",
    color: "#64748B",
    border: "1px solid #475569",
    padding: "14px 28px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
    opacity: 0.7,
  },
};
