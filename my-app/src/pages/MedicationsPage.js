import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { startMedicineAlarm, stopMedicineAlarm } from "../medicineAlarm";
import "./styles.css";

const storageKey = "easy-med-schedule";
const dataChangeEvent = "everyday-tracker-data-change";
const tesseractScriptUrl = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
let tesseractLoadPromise;

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
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(
    "After choosing a photo, OCR will try to read the label. Check the filled fields before saving."
  );
  const navigate = useNavigate();

  const dueMedications = medications.filter((medication) => isMedicationDue(medication, currentTime));
  const dueMedicationMessage = dueMedications
    .map((medication) => `${medication.name}-${medication.times}`)
    .join("|");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(medications));
    window.dispatchEvent(new Event(dataChangeEvent));
  }, [medications]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    if (dueMedications.length === 0) {
      stopMedicineAlarm();
      setSoundBlocked(false);
      return undefined;
    }

    startMedicineAlarm().then((didStart) => {
      if (isCurrent) {
        setSoundBlocked(!didStart);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [dueMedicationMessage, dueMedications.length]);

  async function handleEnableSound() {
    const didStart = await startMedicineAlarm();
    setSoundBlocked(!didStart);
  }

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
        confirmed: false,
        confirmedDate: "",
      },
    ]);
    setNewMedication(emptyMedication);
  }

  function removeMedication(id) {
    setMedications((currentMedications) =>
      currentMedications.filter((medication) => medication.id !== id)
    );
  }

  function confirmMedicationTaken(id) {
    setMedications((currentMedications) =>
      currentMedications.map((medication) =>
        medication.id === id
          ? {
              ...medication,
              confirmed: true,
              confirmedDate: getTodayKey(),
            }
          : medication
      )
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

    const tesseract = await loadTesseract();

    if (!tesseract) {
      setOcrStatus(
        "OCR could not load. You can still type the medicine details or use the sample button."
      );
      return;
    }

    setOcrStatus("Reading label. This may take a moment.");

    try {
      const result = await tesseract.recognize(file, "eng");
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
    <div className="medication-page">
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
        <button className="secondary-button-print-schedule" type="button" onClick={() => window.print()}>
          Print schedule
        </button>
        <button onClick={handleLogout} className="logout-button" type="button">
          Log Out
        </button>
      </header>

      <main id="main" className="app-shell">
        {dueMedications.length > 0 && (
          <section className="medicine-alert" aria-live="assertive" aria-labelledby="medicine-alert-title">
            <div>
              <p className="reminder-type">Medicine due now</p>
              <h2 id="medicine-alert-title">Time to take your medicine</h2>
              <p>
                {dueMedications
                  .map((medication) => `${medication.name} at ${getMedicationTiming(medication.times).displayDose?.label || medication.times}`)
                  .join(", ")}
              </p>
            </div>
            <div className="alert-actions">
              <button className="alert-button" type="button" onClick={handleEnableSound}>
                {soundBlocked ? "Enable sound" : "Ring again"}
              </button>
              <button className="alert-button secondary-alert-button" type="button" onClick={stopMedicineAlarm}>
                Stop sound
              </button>
              {dueMedications.map((medication) => (
                <button
                  className="alert-button"
                  type="button"
                  key={medication.id}
                  onClick={() => confirmMedicationTaken(medication.id)}
                >
                  I took {medication.name}
                </button>
              ))}
            </div>
          </section>
        )}

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

          {medications.length === 0 ? (
            <div className="empty-state">
              <h3>No schedule yet</h3>
              <p>Add the first medication. It will appear here in plain language with times and instructions.</p>
            </div>
          ) : (
            <ul className="med-list" aria-live="polite">
              {medications.map((medication) => (
                <li
                  className={`med-card ${isMedicationDue(medication, currentTime) ? "is-due" : ""}`}
                  key={medication.id}
                >
                  <div className="med-card-header">
                    <div>
                      <h3>{medication.name}</h3>
                      <p className="med-purpose">For: {medication.purpose}</p>
                      {isMedicationDue(medication, currentTime) && (
                        <p className="due-label">Due now</p>
                      )}
                    </div>
                    <button
                      className="delete-button"
                      type="button"
                      aria-label={`Remove ${medication.name}`}
                      onClick={() => removeMedication(medication.id)}
                    >
                      Remove
                    </button>
                    {isMedicationDue(medication, currentTime) && (
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => confirmMedicationTaken(medication.id)}
                      >
                        I took it
                      </button>
                    )}
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

function loadTesseract() {
  if (window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }

  if (!tesseractLoadPromise) {
    tesseractLoadPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = tesseractScriptUrl;
      script.async = true;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  }

  return tesseractLoadPromise;
}

function isMedicationDue(medication, now = new Date()) {
  if (isConfirmedToday(medication)) {
    return false;
  }

  return Boolean(getMedicationTiming(medication.times, now).dueDose);
}

function getMedicationTiming(times, now = new Date()) {
  const parsedTimes = parseMedicationTimes(times);

  if (parsedTimes.length === 0) {
    return {
      dueDose: null,
      nextDose: null,
      displayDose: null,
    };
  }

  const todayDoses = parsedTimes
    .map((time) => {
      const date = new Date();
      date.setHours(time.hours, time.minutes, 0, 0);
      return {
        date,
        label: formatDoseTime(date),
      };
    })
    .sort((firstDose, secondDose) => firstDose.date - secondDose.date);

  const dueDoses = todayDoses.filter((dose) => dose.date <= now);
  const dueDose = dueDoses[dueDoses.length - 1] || null;
  const nextDose = todayDoses.find((dose) => dose.date > now) || null;

  return {
    dueDose,
    nextDose,
    displayDose: dueDose || nextDose || todayDoses[todayDoses.length - 1],
  };
}

function parseMedicationTimes(times) {
  const matches = String(times || "").match(/\d{1,2}(:\d{2})?\s?(am|pm)?/gi) || [];

  return matches
    .map((value) => {
      const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s?(am|pm)?$/i);

      if (!match) {
        return null;
      }

      let hours = Number(match[1]);
      const minutes = Number(match[2] || 0);
      const meridiem = match[3]?.toLowerCase();

      if (meridiem === "pm" && hours < 12) {
        hours += 12;
      }

      if (meridiem === "am" && hours === 12) {
        hours = 0;
      }

      if (hours > 23 || minutes > 59) {
        return null;
      }

      return { hours, minutes };
    })
    .filter(Boolean);
}

function formatDoseTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isConfirmedToday(medication) {
  return Boolean(medication.confirmed && medication.confirmedDate === getTodayKey());
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default MedicationsPage;
