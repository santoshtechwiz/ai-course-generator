"use client"

import { useSelector } from "react-redux"

export function ReduxStateDebug({ selector = (state: any) => state.quiz }) {
  const state = useSelector(selector);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: "rgba(30,30,30,0.95)",
        color: "#fff",
        fontSize: 12,
        maxWidth: 400,
        maxHeight: 400,
        overflow: "auto",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        padding: 12,
        fontFamily: "monospace",
        opacity: 0.85,
      }}
      data-testid="redux-state-debug"
    >
      <div style={{ fontWeight: "bold", marginBottom: 4 }}>Redux State Debug</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
