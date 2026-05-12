import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { recognize } from "tesseract.js";
import { startMedicineAlarm, stopMedicineAlarm } from "../medicineAlarm";
import "./styles.css";

const storageKey = "easy-med-schedule";
const dataChangeEvent = "everyday-tracker-data-change";
const ocrAssetPath = `${process.env.PUBLIC_URL || ""}/ocr`;

const emptyMedication = {
  name: "",
  purpose: "",
  dosage: "",
  frequency: "Once daily",
  times: "",
  instructions: "",
  sideEffects: "",
  reminderDelayMinutes: "30",
};

function MedicationsPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [medications, setMedications] = useState(() => loadMedications());
  const [newMedication, setNewMedication] = useState(emptyMedication);
  const [editingMedicationId, setEditingMedicationId] = useState(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState("30");
  const [entryMode, setEntryMode] = useState("manual");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
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
    return () => {
      stopCameraStream();
    };
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

    if (editingMedicationId) {
      setMedications((currentMedications) =>
        currentMedications.map((currentMedication) =>
          currentMedication.id === editingMedicationId
            ? {
                ...currentMedication,
                ...medication,
              }
            : currentMedication
        )
      );
    } else {
      setMedications((currentMedications) => [
        ...currentMedications,
        {
          ...medication,
          id: Date.now(),
          confirmed: false,
          confirmedDate: "",
          lastTakenAt: "",
          takenHistory: [],
          snoozedUntil: "",
        },
      ]);
    }

    setNewMedication(emptyMedication);
    setEditingMedicationId(null);
  }

  function removeMedication(id) {
    setMedications((currentMedications) =>
      currentMedications.filter((medication) => medication.id !== id)
    );
  }

  function confirmMedicationTaken(id) {
    const takenAt = new Date();

    setMedications((currentMedications) =>
      currentMedications.map((medication) =>
        medication.id === id
          ? {
              ...medication,
              confirmed: true,
              confirmedDate: getTodayKey(),
              lastTakenAt: formatTakenTime(takenAt),
              snoozedUntil: "",
              takenHistory: [
                {
                  date: getTodayKey(takenAt),
                  time: formatTakenTime(takenAt),
                  timestamp: takenAt.toISOString(),
                },
                ...(medication.takenHistory || []),
              ].slice(0, 10),
            }
          : medication
      )
    );
  }

  function snoozeMedication(id) {
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + Number(snoozeMinutes || 30));

    setMedications((currentMedications) =>
      currentMedications.map((medication) =>
        medication.id === id
          ? {
              ...medication,
              snoozedUntil: snoozedUntil.toISOString(),
            }
          : medication
      )
    );
    setOcrStatus(`Reminder moved ${snoozeMinutes} minutes later.`);
  }

  function editMedication(medication) {
    setEditingMedicationId(medication.id);
    setEntryMode("manual");
    setNewMedication({
      name: medication.name === "Not listed" ? "" : medication.name || "",
      purpose: medication.purpose === "Not listed" ? "" : medication.purpose || "",
      dosage: medication.dosage === "Not listed" ? "" : medication.dosage || "",
      frequency: medication.frequency || "Once daily",
      times: medication.times === "Not listed" ? "" : medication.times || "",
      instructions: medication.instructions === "Not listed" ? "" : medication.instructions || "",
      sideEffects: medication.sideEffects === "Not listed" ? "" : medication.sideEffects || "",
      reminderDelayMinutes: String(medication.reminderDelayMinutes || 30),
    });
    window.requestAnimationFrame(() => {
      document.querySelector("#form-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

    await processBottleImage(file, file.name);
    event.target.value = "";
  }

  function openPhotoPicker() {
    setCameraError("");
    setOcrStatus("Choose a clear photo of the bottle label.");
    fileInputRef.current?.click();
  }

  async function processBottleImage(file, photoName) {
    setSelectedPhotoName(photoName);
    setCameraError("");
    setOcrStatus("Reading label. This may take a moment.");

    try {
      const imageForOcr = await prepareImageForOcr(file);
      const result = await recognize(imageForOcr, "eng", {
        workerPath: `${ocrAssetPath}/worker.min.js`,
        corePath: ocrAssetPath,
        workerBlobURL: false,
        logger: (message) => {
          if (message.status === "recognizing text") {
            setOcrStatus(`Reading label: ${Math.round(message.progress * 100)}% done.`);
          }
        },
      });
      const filledFields = applyOcrText(result.data.text || "");
      setOcrStatus(
        filledFields.length
          ? `Label read. Filled: ${filledFields.join(", ")}. Please review before saving.`
          : "Label read, but the text was unclear. Please type the details you can see."
      );
    } catch (error) {
      setOcrStatus(
        error.message ||
          "OCR could not read this photo. Try a brighter, closer JPG or PNG picture."
      );
    }
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser. You can still upload a photo.");
      return;
    }

    setCameraError("");
    setOcrStatus("Opening camera. Your browser may ask for permission.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            setCameraError("Camera opened, but the preview could not start.");
          });
        }
      }, 0);

      setOcrStatus("Camera is open. Hold the bottle label steady, then press Take photo.");
    } catch {
      setCameraError("Camera permission was blocked or no camera was found. Try uploading a photo instead.");
      setOcrStatus("Camera could not open. You can still upload a photo.");
    }
  }

  function closeCamera() {
    stopCameraStream();
    setCameraOpen(false);
  }

  function stopCameraStream() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function takeCameraPhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      setCameraError("Camera is still loading. Wait a second, then try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Photo could not be captured. Please try again.");
        return;
      }

      const photoFile = new File([blob], "camera-bottle-label.jpg", { type: "image/jpeg" });
      processBottleImage(photoFile, "Camera photo");
      closeCamera();
    }, "image/jpeg", 0.92);
  }

  function applyOcrText(text) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const extractedMedication = extractMedicationFromLabel(text, lines);
    const filledFields = [];

    setNewMedication((currentMedication) => ({
      ...currentMedication,
      name: currentMedication.name || trackFilledField("name", extractedMedication.name),
      dosage: currentMedication.dosage || trackFilledField("dosage", extractedMedication.dosage),
      frequency:
        currentMedication.frequency !== emptyMedication.frequency
          ? currentMedication.frequency
          : trackFilledField("frequency", extractedMedication.frequency) || currentMedication.frequency,
      times: currentMedication.times || trackFilledField("times", extractedMedication.times),
      instructions:
        currentMedication.instructions ||
        trackFilledField("instructions", extractedMedication.instructions),
    }));

    return filledFields;

    function trackFilledField(fieldName, value) {
      if (value) {
        filledFields.push(fieldName);
      }

      return value || "";
    }
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
              <label className="alert-select-label" htmlFor="snooze-minutes">
                Remind again in
                <select
                  id="snooze-minutes"
                  value={snoozeMinutes}
                  onChange={(event) => setSnoozeMinutes(event.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </label>
              {dueMedications.map((medication) => (
                <button
                  className="alert-button secondary-alert-button"
                  type="button"
                  key={`snooze-${medication.id}`}
                  onClick={() => snoozeMedication(medication.id)}
                >
                  Remind me later
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="entry-panel" aria-labelledby="form-title">
          <div className="section-heading">
            <h2 id="form-title">{editingMedicationId ? "Edit medication" : "Add a medication"}</h2>
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
              <div className="camera-actions">
                <button className="primary-button camera-button" type="button" onClick={openCamera}>
                  Open camera
                </button>
                <button className="upload-photo-button" type="button" onClick={openPhotoPicker}>
                  Upload photo
                </button>
              </div>

              <input
                ref={fileInputRef}
                className="sr-only-photo-input"
                id="labelPhoto"
                name="labelPhoto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={readBottleLabel}
              />

              {cameraOpen && (
                <div className="camera-panel" aria-label="Camera preview">
                  <video ref={videoRef} playsInline muted />
                  <div className="camera-actions">
                    <button className="primary-button camera-button" type="button" onClick={takeCameraPhoto}>
                      Take photo
                    </button>
                    <button className="secondary-button camera-button" type="button" onClick={closeCamera}>
                      Close camera
                    </button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="camera-canvas" aria-hidden="true" />

              {cameraError && (
                <p className="camera-error" role="alert">
                  {cameraError}
                </p>
              )}

              <p className="photo-instructions">
                Take or upload a clear photo of the bottle label. Then check the filled fields before saving.
              </p>
              {selectedPhotoName && (
                <p className="photo-name">Selected photo: {selectedPhotoName}</p>
              )}
              <p role="status" aria-live="polite">
                {ocrStatus}
              </p>
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

              <label htmlFor="reminderDelayMinutes">
                <span>If missed, remind again after</span>
                <select
                  id="reminderDelayMinutes"
                  name="reminderDelayMinutes"
                  value={newMedication.reminderDelayMinutes}
                  onChange={handleChange}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
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
                {editingMedicationId ? "Save changes" : "Save medication"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setNewMedication(emptyMedication);
                  setEditingMedicationId(null);
                }}
              >
                {editingMedicationId ? "Cancel edit" : "Clear form"}
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
                      {shouldShowLastTaken(medication) && (
                        <p className="last-taken-message">
                          Last taken today at {medication.lastTakenAt}
                        </p>
                      )}
                      {isMedicationDue(medication, currentTime) && (
                        <p className="due-label">Due now</p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button
                        className="delete-button"
                        type="button"
                        aria-label={`Edit ${medication.name}`}
                        onClick={() => editMedication(medication)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        type="button"
                        aria-label={`Remove ${medication.name}`}
                        onClick={() => removeMedication(medication.id)}
                      >
                        Remove
                      </button>
                    </div>
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
                    <div>
                      <dt>Reminder</dt>
                      <dd>Remind again after {formatMinutesLabel(medication.reminderDelayMinutes || 30)}</dd>
                    </div>
                  </dl>
                  <div className="history-box">
                    <h4>Medication history</h4>
                    {medication.takenHistory?.length ? (
                      <ul>
                        {medication.takenHistory.map((entry) => (
                          <li key={entry.timestamp || `${entry.date}-${entry.time}`}>
                            Taken on {formatHistoryDate(entry.date)} at {entry.time}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No taken history yet.</p>
                    )}
                  </div>
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
    reminderDelayMinutes: Number(medication.reminderDelayMinutes) || 30,
  };
}

async function prepareImageForOcr(file) {
  if (isHeicImage(file)) {
    throw new Error(
      "This looks like a HEIC iPhone photo, which OCR cannot read here. Please use the camera button, or choose a JPG or PNG photo."
    );
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const maxSize = 1600;
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("The photo could not be prepared for OCR. Try a JPG or PNG photo."));
          }
        },
        "image/jpeg",
        0.9
      );
    });
  } catch {
    throw new Error(
      "This photo could not be opened by the browser. Try using the camera button, or upload a JPG or PNG photo."
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageUrl;
  });
}

function isHeicImage(file) {
  return (
    /hei(c|f)/i.test(file.type || "") ||
    /\.(hei(c|f))$/i.test(file.name || "")
  );
}

function extractMedicationFromLabel(text, lines) {
  const dosageMatch = text.match(/\b\d+(\.\d+)?\s?(mg|mcg|g|ml|units?)\b/i);
  const instructionLine = findInstructionLine(lines);
  const frequency = extractFrequency(text);
  const times = extractTimes(text);

  return {
    name: extractMedicationName(lines, dosageMatch?.[0]),
    dosage: dosageMatch?.[0] || "",
    frequency,
    times,
    instructions: instructionLine,
  };
}

function extractMedicationName(lines, dosage) {
  const skipPattern =
    /\b(rx|qty|refill|refills|pharmacy|doctor|dr\.|patient|take|tablet|capsule|capsules|warning|discard|expiration|use by|prescriber|phone|date)\b/i;

  const lineWithDosage = dosage
    ? lines.find((line) => line.toLowerCase().includes(dosage.toLowerCase()))
    : "";

  if (lineWithDosage) {
    const possibleName = cleanMedicineName(lineWithDosage, dosage);
    if (possibleName) {
      return possibleName;
    }
  }

  const likelyNameLine = lines.find(
    (line) =>
      /[a-z]/i.test(line) &&
      !skipPattern.test(line) &&
      !/\d{3,}|^\W+$/.test(line)
  );

  return cleanMedicineName(likelyNameLine || "", dosage);
}

function cleanMedicineName(value, dosage) {
  return String(value || "")
    .replace(dosage || "", "")
    .replace(/\b(tablets?|capsules?|caps?|tabs?|oral|solution|cream|ointment)\b/gi, "")
    .replace(/[^a-z0-9 -]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findInstructionLine(lines) {
  const instructionLines = lines.filter((line) =>
    /\b(take|use|apply|inject|place|chew|dissolve|with food|before bed|after meal|by mouth|under the tongue)\b/i.test(
      line
    )
  );

  return instructionLines.join(" ").replace(/\s+/g, " ").trim();
}

function extractFrequency(text) {
  const frequencyPatterns = [
    { pattern: /\btwice (a day|daily)\b/i, value: "Twice daily" },
    { pattern: /\bthree times (a day|daily)\b/i, value: "Three times daily" },
    { pattern: /\bonce (a day|daily)\b|\bdaily\b/i, value: "Once daily" },
    { pattern: /\bevery other day\b/i, value: "Every other day" },
    { pattern: /\bas needed\b|\bprn\b/i, value: "As needed" },
  ];

  return frequencyPatterns.find(({ pattern }) => pattern.test(text))?.value || "";
}

function extractTimes(text) {
  const clockTimes = text.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)\b/gi);

  if (clockTimes?.length) {
    return clockTimes.join(", ");
  }

  const dayParts = [];

  if (/\bmorning\b/i.test(text)) {
    dayParts.push("morning");
  }

  if (/\bnoon\b|\blunch\b/i.test(text)) {
    dayParts.push("noon");
  }

  if (/\bevening\b|\bdinner\b/i.test(text)) {
    dayParts.push("evening");
  }

  if (/\bbedtime\b|\bbefore bed\b/i.test(text)) {
    dayParts.push("bedtime");
  }

  return dayParts.join(", ");
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

function isMedicationDue(medication, now = new Date()) {
  if (isConfirmedToday(medication)) {
    return false;
  }

  if (medication.snoozedUntil && new Date(medication.snoozedUntil) > now) {
    return false;
  }

  return Boolean(getMedicationTiming(medication.times, now).dueDose);
}

function shouldShowLastTaken(medication) {
  return Boolean(
    medication.lastTakenAt &&
      medication.confirmedDate === getTodayKey() &&
      hasMultipleDailyDoses(medication)
  );
}

function hasMultipleDailyDoses(medication) {
  return (
    parseMedicationTimes(medication.times).length > 1 ||
    /twice|three times|multiple/i.test(medication.frequency || "")
  );
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

function formatTakenTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isConfirmedToday(medication) {
  return Boolean(medication.confirmed && medication.confirmedDate === getTodayKey());
}

function getTodayKey(today = new Date()) {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMinutesLabel(minutes) {
  return Number(minutes) === 60 ? "1 hour" : `${minutes} minutes`;
}

function formatHistoryDate(value) {
  if (!value) {
    return "today";
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default MedicationsPage;
