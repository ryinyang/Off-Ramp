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
      // Return user or close tab after break ends
      window.history.back();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div style={styles.fullscreenContainer}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>⏱️</div>
        <h1 style={styles.title}>Off-Ramp Active</h1>
        <p style={styles.message}>"{message}"</p>

        <div style={styles.timerCircle}>
          <span style={styles.timerNumber}>{timeLeft}</span>
          <span style={styles.timerLabel}>seconds remaining</span>
        </div>

        <p style={styles.subtext}>
          Take a deep breath. Focus on your real-world priorities.
        </p>

        <button style={styles.buttonClose} onClick={() => window.history.back()}>
          Return to Previous Page
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
    backgroundColor: "#312E81",
    border: "4px solid #6366F1",
    marginBottom: "24px",
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
  },
  buttonClose: {
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
};
