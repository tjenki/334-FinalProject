import { Link, useNavigate } from "react-router-dom";
import "./styles.css";

const medicationStorageKey = "easy-med-schedule";

function MedicationHistoryPage() {
  const navigate = useNavigate();
  const medications = loadMedications();

  function handleLogout() {
    localStorage.removeItem("username");
    navigate("/");
  }

  return (
    <div className="medication-page medication-history-page">
      <a className="skip-link" href="#main">
        Skip to medication history
      </a>

      <header className="app-header">
        <div>
          <h1>Medication History</h1>

          <nav className="med-nav" aria-label="Main pages">
            <Link to="/home">Home</Link>
            <Link to="/medications">Medications</Link>
            <Link to="/medication-history" aria-current="page">
              Medication history
            </Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/tasks">Settings</Link>
          </nav>
        </div>

        <button onClick={handleLogout} className="logout-button" type="button">
          Log Out
        </button>
      </header>

      <main id="main" className="history-shell">
        <section className="schedule-panel history-list-panel" aria-labelledby="history-title">
          <div className="section-heading">
            <h2 id="history-title">All medication history</h2>
            <p>
              {medications.length
                ? `${medications.length} medication${medications.length === 1 ? "" : "s"} listed.`
                : "No medications saved yet."}
            </p>
          </div>

          {medications.length === 0 ? (
            <div className="empty-state">
              <h3>No medication history yet</h3>
              <p>Add a medication first. When you mark it as taken, the time will show here.</p>
            </div>
          ) : (
            <ul className="med-list" aria-live="polite">
              {medications.map((medication) => (
                <li className="med-card" key={medication.id}>
                  <div className="med-card-header">
                    <div>
                      <h3>{medication.name}</h3>
                      <p className="med-purpose">For: {medication.purpose || "Not listed"}</p>
                      {hasLastTakenTime(medication) ? (
                        <p className="last-taken-message">
                          Last taken {formatHistoryDate(medication.confirmedDate)} at{" "}
                          {medication.lastTakenAt}
                        </p>
                      ) : (
                        <p className="last-taken-message">Not marked as taken yet.</p>
                      )}
                      <MedicationWarnings medication={medication} />
                    </div>
                    <Link className="history-edit-link" to="/medications">
                      Edit
                    </Link>
                  </div>

                  <dl>
                    <div>
                      <dt>Dosage</dt>
                      <dd>{medication.dosage || "Not listed"}</dd>
                    </div>
                    <div>
                      <dt>Frequency</dt>
                      <dd>{medication.frequency || "Not listed"}</dd>
                    </div>
                    <div>
                      <dt>Times</dt>
                      <dd>{medication.times || "Not listed"}</dd>
                    </div>
                    <div>
                      <dt>Refills left</dt>
                      <dd>{medication.refillsLeft || "Not listed"}</dd>
                    </div>
                    <div>
                      <dt>Prescription expires</dt>
                      <dd>{medication.prescriptionExpires || "Not listed"}</dd>
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

function loadMedications() {
  try {
    return JSON.parse(localStorage.getItem(medicationStorageKey)) || [];
  } catch {
    return [];
  }
}

function hasLastTakenTime(medication) {
  return Boolean(medication.lastTakenAt && medication.confirmedDate);
}

function MedicationWarnings({ medication }) {
  const warnings = getMedicationWarnings(medication);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="warning-list" aria-label={`Warnings for ${medication.name}`}>
      {warnings.map((warning) => (
        <p className="med-warning" key={warning}>
          {warning}
        </p>
      ))}
    </div>
  );
}

function getMedicationWarnings(medication) {
  const warnings = [];

  if (shouldWarnRefillSoon(medication.refillsLeft)) {
    warnings.push("Refill soon");
  }

  if (shouldWarnPrescriptionExpiresSoon(medication.prescriptionExpiresRaw)) {
    warnings.push("Prescription expires soon");
  }

  return warnings;
}

function shouldWarnRefillSoon(refillsLeft) {
  const refillNumber = Number(refillsLeft);

  return Number.isFinite(refillNumber) && refillNumber <= 1;
}

function shouldWarnPrescriptionExpiresSoon(rawDate) {
  if (!rawDate) {
    return false;
  }

  const expirationDate = new Date(`${rawDate}T12:00:00`);

  if (Number.isNaN(expirationDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);

  const daysUntilExpiration = (expirationDate - today) / (1000 * 60 * 60 * 24);

  return daysUntilExpiration >= 0 && daysUntilExpiration <= 30;
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

export default MedicationHistoryPage;
