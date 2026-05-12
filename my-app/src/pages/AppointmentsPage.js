import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles.css";

const appointmentStorageKey = "everyday-tracker-appointments";
const dataChangeEvent = "everyday-tracker-data-change";

const emptyAppointment = {
  provider: "",
  reason: "",
  date: "",
  time: "",
  location: "",
  transportation: "",
  notes: "",
  reminderBeforeMinutes: "30",
};

function AppointmentsPage() {
  const [appointments, setAppointments] = useState(() => removePastAppointments(loadAppointments()));
  const [newAppointment, setNewAppointment] = useState(emptyAppointment);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const navigate = useNavigate();

  const appointmentReminders = appointments.filter((appointment) =>
    isAppointmentReminderDue(appointment, currentTime)
  );

  useEffect(() => {
    const upcomingAppointments = removePastAppointments(appointments);
    localStorage.setItem(appointmentStorageKey, JSON.stringify(upcomingAppointments));
    window.dispatchEvent(new Event(dataChangeEvent));
  }, [appointments]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setNewAppointment((currentAppointment) => ({
      ...currentAppointment,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const appointment = normalizeAppointment(newAppointment);

    if (!appointment.provider && !appointment.reason) {
      return;
    }

    if (editingAppointmentId) {
      setAppointments((currentAppointments) =>
        currentAppointments.map((currentAppointment) =>
          currentAppointment.id === editingAppointmentId
            ? {
                ...currentAppointment,
                ...appointment,
              }
            : currentAppointment
        )
      );
    } else {
      setAppointments((currentAppointments) => [
        ...currentAppointments,
        {
          ...appointment,
          id: Date.now(),
          confirmed: false,
        },
      ]);
    }

    setNewAppointment(emptyAppointment);
    setEditingAppointmentId(null);
  }

  function removeAppointment(id) {
    setAppointments((currentAppointments) =>
      currentAppointments.filter((appointment) => appointment.id !== id)
    );
  }

  function fillSampleAppointment() {
    setNewAppointment({
      provider: "Dr. Smith",
      reason: "Blood pressure check",
      date: "2026-05-20",
      time: "10:30",
      location: "Main Street Clinic, Room 204",
      transportation: "Maria will drive",
      notes: "Bring medication list and insurance card.",
      reminderBeforeMinutes: "30",
    });
  }

  function editAppointment(appointment) {
    setEditingAppointmentId(appointment.id);
    setNewAppointment({
      provider: appointment.provider === "Appointment" ? "" : appointment.provider || "",
      reason: appointment.reason === "Not listed" ? "" : appointment.reason || "",
      date: appointment.rawDate || "",
      time: appointment.rawTime || "",
      location: appointment.location === "Not listed" ? "" : appointment.location || "",
      transportation:
        appointment.transportation === "Not listed" ? "" : appointment.transportation || "",
      notes: appointment.notes === "Not listed" ? "" : appointment.notes || "",
      reminderBeforeMinutes: String(appointment.reminderBeforeMinutes || 30),
    });
    window.requestAnimationFrame(() => {
      document
        .querySelector("#appointment-form-title")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function confirmAppointmentReminder(id) {
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === id ? { ...appointment, confirmed: true } : appointment
      )
    );
  }

  function handleLogout() {
    localStorage.removeItem("username");
    navigate("/");
  }

  return (
    <div className="appointment-page medication-page">
      <a className="skip-link" href="#main">
        Skip to appointment form
      </a>

      <header className="app-header">
        <div>
          <h1>Appointments</h1>
         
          <nav className="med-nav" aria-label="Main pages">
            <Link to="/home">Home</Link>
            <Link to="/medications">Medications</Link>
            <Link to="/appointments" aria-current="page">
              Appointments
            </Link>
            <Link to="/tasks">Settings</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="logout-button" type="button">
          Log Out
        </button>
      </header>

      <main id="main" className="app-shell">
        {appointmentReminders.length > 0 && (
          <section className="medicine-alert appointment-alert" aria-live="assertive" aria-labelledby="appointment-alert-title">
            <div>
              <p className="reminder-type">Appointment reminder</p>
              <h2 id="appointment-alert-title">Time to get ready</h2>
              <p>
                {appointmentReminders
                  .map((appointment) => `${appointment.provider} at ${appointment.time}`)
                  .join(", ")}
              </p>
            </div>
            <div className="alert-actions">
              {appointmentReminders.map((appointment) => (
                <button
                  className="alert-button"
                  type="button"
                  key={appointment.id}
                  onClick={() => confirmAppointmentReminder(appointment.id)}
                >
                  Got it
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="entry-panel" aria-labelledby="appointment-form-title">
          <div className="section-heading">
            <h2 id="appointment-form-title">
              {editingAppointmentId ? "Edit appointment" : "Add an appointment"}
            </h2>
            <p>Fill in what you know. Blank details will be saved as “Not listed.”</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <label htmlFor="provider">
                <span>Doctor, clinic, or provider</span>
                <input
                  id="provider"
                  name="provider"
                  autoComplete="off"
                  placeholder="Example: Dr. Smith"
                  value={newAppointment.provider}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="reason">
                <span>Reason for visit</span>
                <input
                  id="reason"
                  name="reason"
                  autoComplete="off"
                  placeholder="Example: blood pressure check"
                  value={newAppointment.reason}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="date">
                <span>Date</span>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={newAppointment.date}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="time">
                <span>Time</span>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={newAppointment.time}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="location">
                <span>Location</span>
                <input
                  id="location"
                  name="location"
                  autoComplete="off"
                  placeholder="Example: Main Street Clinic"
                  value={newAppointment.location}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="transportation">
                <span>Ride or transportation</span>
                <input
                  id="transportation"
                  name="transportation"
                  autoComplete="off"
                  placeholder="Example: caregiver will drive"
                  value={newAppointment.transportation}
                  onChange={handleChange}
                />
              </label>

              <label htmlFor="reminderBeforeMinutes">
                <span>Remind me before</span>
                <select
                  id="reminderBeforeMinutes"
                  name="reminderBeforeMinutes"
                  value={newAppointment.reminderBeforeMinutes}
                  onChange={handleChange}
                >
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                </select>
              </label>
            </div>

            <label className="full-width" htmlFor="notes">
              <span>Helpful notes</span>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                placeholder="Example: bring insurance card, arrive 15 minutes early"
                value={newAppointment.notes}
                onChange={handleChange}
              />
            </label>

            <div className="reminder-box" role="note">
              <strong>Tip:</strong> Add caregiver details, what to bring, or questions to ask the
              doctor.
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                {editingAppointmentId ? "Save changes" : "Save appointment"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setNewAppointment(emptyAppointment);
                  setEditingAppointmentId(null);
                }}
              >
                {editingAppointmentId ? "Cancel edit" : "Clear form"}
              </button>
              <button className="secondary-button" type="button" onClick={fillSampleAppointment}>
                Fill sample
              </button>
            </div>
          </form>
        </section>

        <section className="schedule-panel" aria-labelledby="appointment-list-title">
          <div className="section-heading">
            <h2 id="appointment-list-title">Upcoming appointments</h2>
            <p>
              {appointments.length
                ? `${appointments.length} appointment${appointments.length === 1 ? "" : "s"} saved.`
                : "No appointments saved yet."}
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="empty-state">
              <h3>No appointments yet</h3>
              <p>Add the first appointment. It will appear here with date, time, place, and notes.</p>
            </div>
          ) : (
            <ul className="med-list" aria-live="polite">
              {appointments.map((appointment) => (
                <li className="med-card appointment-card" key={appointment.id}>
                  <div className="med-card-header">
                    <div>
                      <h3>{appointment.provider}</h3>
                      <p className="med-purpose">Reason: {appointment.reason}</p>
                    </div>
                    <div className="card-actions">
                      <button
                        className="delete-button"
                        type="button"
                        aria-label={`Edit appointment with ${appointment.provider}`}
                        onClick={() => editAppointment(appointment)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        type="button"
                        aria-label={`Remove appointment with ${appointment.provider}`}
                        onClick={() => removeAppointment(appointment.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <dl>
                    <div>
                      <dt>Date</dt>
                      <dd>{appointment.date}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{appointment.time}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{appointment.location}</dd>
                    </div>
                    <div>
                      <dt>Transportation</dt>
                      <dd>{appointment.transportation}</dd>
                    </div>
                    <div>
                      <dt>Notes</dt>
                      <dd>{appointment.notes}</dd>
                    </div>
                    <div>
                      <dt>Reminder</dt>
                      <dd>{formatMinutesLabel(appointment.reminderBeforeMinutes || 30)} before</dd>
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

function normalizeAppointment(appointment) {
  return {
    provider: clean(appointment.provider) || "Appointment",
    reason: clean(appointment.reason) || "Not listed",
    date: formatDate(appointment.date) || "Not listed",
    time: formatTime(appointment.time) || "Not listed",
    rawDate: clean(appointment.date),
    rawTime: clean(appointment.time),
    location: clean(appointment.location) || "Not listed",
    transportation: clean(appointment.transportation) || "Not listed",
    notes: clean(appointment.notes) || "Not listed",
    reminderBeforeMinutes: Number(appointment.reminderBeforeMinutes) || 30,
  };
}

function isAppointmentReminderDue(appointment, now = new Date()) {
  if (appointment.confirmed || !appointment.rawDate || !appointment.rawTime) {
    return false;
  }

  const appointmentDate = new Date(`${appointment.rawDate}T${appointment.rawTime}`);
  const reminderDate = new Date(appointmentDate);
  reminderDate.setMinutes(
    reminderDate.getMinutes() - Number(appointment.reminderBeforeMinutes || 30)
  );

  return now >= reminderDate && now <= appointmentDate;
}

function removePastAppointments(appointments) {
  return appointments.filter((appointment) => !isPastAppointment(appointment));
}

function isPastAppointment(appointment) {
  if (!appointment.rawDate || !appointment.rawTime) {
    return false;
  }

  const appointmentDate = new Date(`${appointment.rawDate}T${appointment.rawTime}`);

  return appointmentDate < new Date();
}

function clean(value) {
  return String(value || "").trim();
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem(appointmentStorageKey)) || [];
  } catch {
    return [];
  }
}

function formatMinutesLabel(minutes) {
  return Number(minutes) === 60 ? "1 hour" : `${minutes} minutes`;
}

export default AppointmentsPage;
