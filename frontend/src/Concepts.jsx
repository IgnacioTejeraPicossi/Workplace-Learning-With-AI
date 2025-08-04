import React, { useState } from "react";
import { fetchConcepts } from "./api";
import ModalDialog from "./ModalDialog";
import { useTheme } from "./ThemeContext";

function Concepts() {
  const [modalOpen, setModalOpen] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleGetConcepts = async () => {
    setLoading(true);
    setModalOpen(true);
    try {
      const result = await fetchConcepts();
      setAiOutput(result.concepts || JSON.stringify(result, null, 2));
    } catch (err) {
      setAiOutput("Error fetching AI concepts.");
    }
    setLoading(false);
  };

  return (
    <div style={{ color: colors.text }}>
      <h2 style={{ color: colors.text }}>AI Concepts</h2>
      <button
        onClick={handleGetConcepts}
        style={{
          background: colors.buttonPrimary,
          color: "#fff",
          border: 0,
          borderRadius: 6,
          padding: "8px 18px",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          marginRight: 8,
          boxShadow: "0 1px 4px #0001"
        }}
        title="Get 3 innovative AI-powered workplace learning concepts."
      >
        Get AI Concepts
      </button>
      <button
        onClick={() => setAiOutput("")}
        style={{
          background: colors.cardBackground,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: 6,
          padding: "8px 18px",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 1px 4px #0001"
        }}
      >
        Clear
      </button>
      <ModalDialog
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        title="AI Concepts"
      >
        {loading ? (
          <div>Loading...</div>
        ) : (
          <pre style={{ whiteSpace: "pre-wrap", color: colors.text }}>{aiOutput}</pre>
        )}
      </ModalDialog>
    </div>
  );
}

export default Concepts; 