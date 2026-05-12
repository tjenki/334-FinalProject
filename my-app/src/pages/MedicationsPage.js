import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";
import { useNavigate } from 'react-router-dom';


const storageKey = "easy-med-schedule";

const emptyMedication = {
  name: "",
  purpose: "",
  dosage: "",
  frequency: "Once daily",
  times: "",
  instructions: "",
  sideEffects: "",
};

function MedicationsPage() {
  const [medications, setMedications] = useState(() => loadMedications());
  const [newMedication, setNewMedication] = useState(emptyMedication);
  const [entryMode, setEntryMode] = useState("manual");
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(
    "After choosing a photo, OCR will try to read the label. Check the filled fields before saving."
  );
  const navigate = useNavigate();


  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(medications));
  }, [medications]);

  const pageClasses = useMemo(() => {
    return [
      "medication-page",
      largeText ? "large-text" : "",
      highContrast ? "high-contrast" : "",
      focusMode ? "focus-mode" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, [focusMode, highContrast, largeText]);

  function handleChange(event) {
    const { name, value } = event.target;

    setNewMedication((currentMedication) => ({
      ...currentMedication,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const medication = normalizeMedication(newMedication);

    if (!medication.name) {
      return;
    }

    setMedications((currentMedications) => [
      ...currentMedications,
      {
        ...medication,
        id: Date.now(),
      },
    ]);
    setNewMedication(emptyMedication);
  }

  function removeMedication(id) {
    setMedications((currentMedications) =>
      currentMedications.filter((medication) => medication.id !== id)
    );
  }

  function fillSampleMedication() {
    setNewMedication({
      name: "Metformin",
      purpose: "blood sugar",
      dosage: "500 mg",
      frequency: "Twice daily",
      times: "8:00 AM, 6:00 PM",
      instructions: "take with food",
      sideEffects: "nausea, upset stomach",
    });
    setOcrStatus("Sample label filled. Please review the fields before saving.");
  }

  async function readBottleLabel(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!window.Tesseract) {
      setOcrStatus(
        "OCR could not load. You can still type the medicine details or use the sample button."
      );
      return;
    }

    setOcrStatus("Reading label. This may take a moment.");

    try {
      const result = await window.Tesseract.recognize(file, "eng");
      applyOcrText(result.data.text || "");
      setOcrStatus("Label read. Please review the filled fields before saving.");
    } catch {
      setOcrStatus(
        "OCR could not read this photo. Try a brighter, closer picture or type the details."
      );
    }
  }

  function applyOcrText(text) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const firstLikelyName = lines.find(
      (line) => /[a-z]/i.test(line) && !/\bmg\b|\btablet\b|\bcapsule\b/i.test(line)
    );
    const dosageMatch = text.match(/\b\d+(\.\d+)?\s?(mg|mcg|g|ml|units?)\b/i);
    const timesMatch = text.match(
      /\b\d{1,2}(:\d{2})?\s?(am|pm)\b(?:\s*,?\s*\b\d{1,2}(:\d{2})?\s?(am|pm)\b)?/i
    );
    const instructionLine = lines.find((line) =>
      /\bwith food\b|\bbefore bed\b|\bafter meal\b|\btake\b/i.test(line)
    );

    setNewMedication((currentMedication) => ({
      ...currentMedication,
      name: currentMedication.name || firstLikelyName || "",
      dosage: currentMedication.dosage || dosageMatch?.[0] || "",
      times: currentMedication.times || timesMatch?.[0] || "",
      instructions: currentMedication.instructions || instructionLine || "",
    }));
  }
  
  function handleLogout() {
  localStorage.removeItem("username");
    navigate("/");
}

  return (
    <div className={pageClasses}>
      <a className="skip-link" href="#main">
        Skip to medicine form
      </a>

      <header className="app-header">
        <div>
          <h1>Medication Schedule</h1>
        
          <nav className="med-nav" aria-label="Main pages">
            <Link to="/home">Home</Link>
            <Link to="/medications" aria-current="page">
              Medications
            </Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/tasks">Settings</Link>
          </nav>
        </div>
        <button className="secondary-button" type="button" onClick={() => window.print()}>
          Print schedule
        </button>
        <button onClick={handleLogout} className="logout-button">
          Log Out
        </button>
      </header>

      <main id="main" className="app-shell">
        <section className="entry-panel" aria-labelledby="form-title">
          <div className="section-heading">
            <h2 id="form-title">Add a medication</h2>
            <p>Enter only what you know. You can come back and fill in missing details later.</p>
          </div>

          <div className="choice-row" role="group" aria-label="Choose how to add medication">
            <button
              className={`mode-button ${entryMode === "manual" ? "active" : ""}`}
              type="button"
              aria-pressed={entryMode === "manual"}
              onClick={() => setEntryMode("manual")}
            >
              Type it in
            </button>
            <button
              className={`mode-button ${entryMode === "photo" ? "active" : ""}`}
              type="button"
              aria-pressed={entryMode === "photo"}
              onClick={() => setEntryMode("photo")}
            >
              Use bottle photo
            </button>
          </div>

          {entryMode === "photo" && (
            <div className="photo-help">
              <label htmlFor="labelPhoto">Take or upload a clear photo of the bottle label</label>
              <input
                id="labelPhoto"
                name="labelPhoto"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={readBottleLabel}
              />
              <p>{ocrStatus}</p>
              <button className="secondary-button" type="button" onClick={fillSampleMedication}>
                Fill sample from label
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <label htmlFor="name">
                <span>Name</span>
                <input
                  id="name"
                  name="name"
                  autoComplete="off"
                  required
                  placeholder="Example: Lisinopril"
                  value={newMedication.name}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="purpose">
                <span>What it is for</span>
                <input
                  id="purpose"
                  name="purpose"
                  autoComplete="off"
                  placeholder="Example: blood pressure"
                  value={newMedication.purpose}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="dosage">
                <span>Dosage</span>
                <input
                  id="dosage"
                  name="dosage"
                  autoComplete="off"
                  placeholder="Example: 10 mg"
                  value={newMedication.dosage}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="frequency">
                <span>Frequency</span>
                <select
                  id="frequency"
                  name="frequency"
                  value={newMedication.frequency}
                  onChange={handleChange}
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                  <option>Every other day</option>
                  <option>As needed</option>
                  <option>Custom</option>
                </select>
              </label>

              <label htmlFor="times">
                <span>Times</span>
                <input
                  id="times"
                  name="times"
                  autoComplete="off"
                  placeholder="Example: 8:00 AM, 8:00 PM"
                  value={newMedication.times}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="instructions">
                <span>Instructions</span>
                <input
                  id="instructions"
                  name="instructions"
                  autoComplete="off"
                  placeholder="Example: take with food"
                  value={newMedication.instructions}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label className="full-width" htmlFor="sideEffects">
              <span>Common side effects</span>
              <textarea
                id="sideEffects"
                name="sideEffects"
                rows="3"
                placeholder="Example: dizziness, upset stomach"
                value={newMedication.sideEffects}
                onChange={handleChange}
              />
            </label>

            <div className="reminder-box" role="note">
              <strong>Safety reminder:</strong> This app helps organize information. Always follow
              the medication label or your clinician's instructions.
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                Save medication
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setNewMedication(emptyMedication)}
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        <section className="schedule-panel" aria-labelledby="schedule-title">
          <div className="section-heading">
            <h2 id="schedule-title">Today's schedule</h2>
            <p>
              {medications.length
                ? `${medications.length} medication${medications.length === 1 ? "" : "s"} saved.`
                : "No medications saved yet."}
            </p>
          </div>

          <div className="support-tools" aria-label="Accessibility display options">
            <button
              className="tool-button"
              type="button"
              aria-pressed={largeText}
              onClick={() => setLargeText((currentValue) => !currentValue)}
            >
              Larger text
            </button>
            <button
              className="tool-button"
              type="button"
              aria-pressed={highContrast}
              onClick={() => setHighContrast((currentValue) => !currentValue)}
            >
              High contrast
            </button>
            <button
              className="tool-button"
              type="button"
              aria-pressed={focusMode}
              onClick={() => setFocusMode((currentValue) => !currentValue)}
            >
              Focus mode
            </button>
          </div>

          {medications.length === 0 ? (
            <div className="empty-state">
              <h3>No schedule yet</h3>
              <p>Add the first medication. It will appear here in plain language with times and instructions.</p>
            </div>
          ) : (
            <ul className="med-list" aria-live="polite">
              {medications.map((medication) => (
                <li className="med-card" key={medication.id}>
                  <div className="med-card-header">
                    <div>
                      <h3>{medication.name}</h3>
                      <p className="med-purpose">For: {medication.purpose}</p>
                    </div>
                    <button
                      className="delete-button"
                      type="button"
                      aria-label={`Remove ${medication.name}`}
                      onClick={() => removeMedication(medication.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <dl>
                    <div>
                      <dt>Dosage</dt>
                      <dd>{medication.dosage}</dd>
                    </div>
                    <div>
                      <dt>Frequency</dt>
                      <dd>{medication.frequency}</dd>
                    </div>
                    <div>
                      <dt>Times</dt>
                      <dd>{medication.times}</dd>
                    </div>
                    <div>
                      <dt>Instructions</dt>
                      <dd>{medication.instructions}</dd>
                    </div>
                    <div>
                      <dt>Common side effects</dt>
                      <dd>{medication.sideEffects}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function normalizeMedication(medication) {
  return {
    name: clean(medication.name),
    purpose: clean(medication.purpose) || "Not listed",
    dosage: clean(medication.dosage) || "Not listed",
    frequency: clean(medication.frequency) || "Not listed",
    times: clean(medication.times) || "Not listed",
    instructions: clean(medication.instructions) || "Not listed",
    sideEffects: clean(medication.sideEffects) || "Not listed",
  };
}

function clean(value) {
  return String(value || "").trim();
}

function loadMedications() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

export default MedicationsPage;