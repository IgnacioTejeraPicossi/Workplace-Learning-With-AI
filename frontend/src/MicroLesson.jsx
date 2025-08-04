import React, { useState } from "react";
import { askStream, saveMicroLesson } from "./api";
import ModalDialog from "./ModalDialog";

function MicroLesson({ query }) {
  const [topic, setTopic] = useState(query || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleGetMicroLesson = async () => {
    setLoading(true);
    setModalOpen(true);
    setShowQuiz(false);
    setAiOutput("");
    let finalOutput = "";
    try {
      await askStream(
        { prompt: `Write a concise, practical micro-lesson for the following workplace topic: ${topic}` },
        (output) => {
          setAiOutput(output);
          finalOutput = output;
        }
      );
      // Save the lesson after streaming is complete
      if (topic && finalOutput) {
        await saveMicroLesson(topic, finalOutput);
      }
    } catch (err) {
      setAiOutput("Error fetching micro-lesson.");
    }
    setLoading(false);
  };

  const handleTakeQuiz = () => {
    setShowQuiz(true);
  };

  return (
    <div>
      <h2>Micro-lesson</h2>
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter micro-lesson topic"
        style={{ marginRight: 8 }}
      />
      <button
        onClick={handleGetMicroLesson}
        disabled={!topic}
        style={{
          background: "#388e3c",
          color: "#fff",
          border: 0,
          borderRadius: 6,
          padding: "8px 18px",
          fontWeight: 600,
          fontSize: 16,
          cursor: !topic ? "not-allowed" : "pointer",
          marginRight: 8,
          boxShadow: "0 1px 4px #0001"
        }}
        title="Generate a custom AI-powered micro-lesson for your chosen topic."
      >
        Get Micro-lesson
      </button>
      <ModalDialog
        isOpen={modalOpen}
        onRequestClose={() => { setModalOpen(false); setShowQuiz(false); }}
        title="Micro-lesson"
      >
        {loading ? (
          <div style={{ width: '100%', margin: '24px 0' }}>
            <div style={{ height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: '80%', height: '100%', background: '#388e3c', animation: 'progressBar 1.2s linear infinite alternate' }} />
            </div>
            <style>{`@keyframes progressBar { 0%{width:10%} 100%{width:90%} }`}</style>
          </div>
        ) : showQuiz ? (
          <div>
            <h3>Quiz (Mocked)</h3>
            <p>Q: What is one key takeaway from this micro-lesson?</p>
            <input type="text" placeholder="Your answer..." style={{ width: '100%', marginBottom: 8 }} />
            <button onClick={() => setShowQuiz(false)} style={{ background: '#388e3c', color: '#fff', border: 0, borderRadius: 6, padding: '6px 16px', fontWeight: 600, fontSize: 15, marginTop: 8 }}>Submit</button>
          </div>
        ) : (
          <>
            <pre style={{ whiteSpace: "pre-wrap" }}>{aiOutput}</pre>
            {aiOutput && (
              <button onClick={handleTakeQuiz} style={{ background: '#1976d2', color: '#fff', border: 0, borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 16, marginTop: 16 }}>Take Quiz</button>
            )}
          </>
        )}
      </ModalDialog>
    </div>
  );
}

export default MicroLesson; 