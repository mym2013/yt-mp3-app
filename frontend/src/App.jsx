import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Por favor ingresa una URL de YouTube.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error en la conversión.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", background: "#111", color: "#f5f5f5" }}>
      <h1 style={{ marginBottom: "1rem" }}>YouTube → MP3 (Cap 4)</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          URL de YouTube:
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #555",
            marginBottom: "0.75rem",
          }}
        />
        <div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "none",
              background: loading ? "#555" : "#1e90ff",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Procesando..." : "Convertir a MP3"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: "#ff6b6b", marginBottom: "1rem" }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div
          style={{
            background: "#222",
            padding: "1rem",
            borderRadius: "6px",
            maxWidth: "700px",
          }}
        >
          <h2>Resultado</h2>
          <p>
            <strong>Archivo original:</strong> {result.original?.fileName} (
            {(result.original?.sizeBytes / (1024 * 1024)).toFixed(2)} MB)
          </p>
          <p>
            <strong>Archivo final:</strong> {result.final?.fileName} (
            {(result.final?.sizeBytes / (1024 * 1024)).toFixed(2)} MB)
          </p>
          <p>
            <strong>¿Comprimido?</strong>{" "}
            {result.final?.compressed ? "Sí" : "No"}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
