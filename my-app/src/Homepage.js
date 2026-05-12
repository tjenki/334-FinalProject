import './Homepage.css';
import { useEffect, useMemo, useState } from 'react';
import AppointmentReminders from './components/AppointmentReminders';
import MedicationReminders from './components/MedicationReminders';
import TaskReminders from './components/TaskReminders';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { startMedicineAlarm, stopMedicineAlarm } from './medicineAlarm';


const initialReminders = {
  medications: [],
  appointments: [],
  tasks: [],
};

const medicationStorageKey = 'easy-med-schedule';
const appointmentStorageKey = 'everyday-tracker-appointments';
const taskStorageKey = 'everyday-tracker-tasks';
const dataChangeEvent = 'everyday-tracker-data-change';

const emptyTask = {
  title: '',
  date: '',
  time: '',
  details: '',
};

const emptyMedication = {
  name: '',
  purpose: '',
  dosage: '',
  frequency: 'Once daily',
  date: '',
  time: '',
  instructions: '',
  reminderDelayMinutes: '30',
};

const emptyAppointment = {
  provider: '',
  reason: '',
  date: '',
  time: '',
  location: '',
  notes: '',
  reminderBeforeMinutes: '30',
};


function Homepage() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const [reminders, setReminders] = useState(() => loadStoredReminders());
  const [newTask, setNewTask] = useState(emptyTask);
  const [newMedication, setNewMedication] = useState(emptyMedication);
  const [newAppointment, setNewAppointment] = useState(emptyAppointment);
  const [activeQuickForm, setActiveQuickForm] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [soundBlocked, setSoundBlocked] = useState(false);

  useEffect(() => {
    function refreshReminders() {
      setReminders(loadStoredReminders());
    }

    const refreshTimer = window.setInterval(refreshReminders, 5000);

    window.addEventListener(dataChangeEvent, refreshReminders);
    window.addEventListener('storage', refreshReminders);
    window.addEventListener('focus', refreshReminders);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener(dataChangeEvent, refreshReminders);
      window.removeEventListener('storage', refreshReminders);
      window.removeEventListener('focus', refreshReminders);
    };
  }, []);

  const completedCount = useMemo(() => {
    const allReminders = [
      ...reminders.medications,
      ...reminders.appointments,
      ...reminders.tasks,
    ];

    return allReminders.filter((reminder) => reminder.confirmed).length;
  }, [reminders]);

  const totalCount =
    reminders.medications.length + reminders.appointments.length + reminders.tasks.length;

  const dueMedications = reminders.medications.filter((medication) => medication.isDue);
  const dueMedicationMessage = dueMedications
    .map((medication) => `${medication.name}-${medication.time}`)
    .join('|');
  const dailyChecklistItems = getDailyChecklistItems(reminders);

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

  function handleLogout() {
    localStorage.removeItem("username");
    navigate("/");
  }

  function handleConfirm(category, reminderId) {
    setReminders((currentReminders) => ({
      ...currentReminders,
      [category]: currentReminders[category].map((reminder) =>
        reminder.id === reminderId
          ? { ...reminder, confirmed: !reminder.confirmed }
          : reminder
      ),
    }));

    if (category === 'medications') {
      toggleStoredItemConfirmed(medicationStorageKey, reminderId);
    }

    if (category === 'appointments') {
      toggleStoredItemConfirmed(appointmentStorageKey, reminderId);
    }

    if (category === 'tasks') {
      toggleStoredItemConfirmed(taskStorageKey, reminderId);
    }
  }

  function handleDeleteAppointment(reminderId) {
    setReminders((currentReminders) => ({
      ...currentReminders,
      appointments: currentReminders.appointments.filter(
        (appointment) => appointment.id !== reminderId
      ),
    }));
    deleteStoredItem(appointmentStorageKey, reminderId);
  }

  function handleTaskChange(event) {
    const { name, value } = event.target;

    setNewTask((currentTask) => ({
      ...currentTask,
      [name]: value,
    }));
  }

  function handleMedicationChange(event) {
    const { name, value } = event.target;

    setNewMedication((currentMedication) => ({
      ...currentMedication,
      [name]: value,
    }));
  }

  function handleAppointmentChange(event) {
    const { name, value } = event.target;

    setNewAppointment((currentAppointment) => ({
      ...currentAppointment,
      [name]: value,
    }));
  }

  function showQuickForm(formName) {
    setActiveQuickForm((currentForm) => (currentForm === formName ? '' : formName));
  }

  function handleAddTask(event) {
    event.preventDefault();

    const taskToAdd = {
      id: editingTaskId || Date.now(),
      title: newTask.title,
      name: newTask.title,
      date: formatDate(newTask.date) || '',
      rawDate: clean(newTask.date),
      time: formatReminderDateTime(newTask.date, newTask.time),
      details: newTask.details || 'No extra notes added.',
      instructions: newTask.details || 'No extra instructions added.',
      confirmed: false,
      category: 'tasks',
    };

    setReminders((currentReminders) => ({
      ...currentReminders,
      tasks: editingTaskId
        ? currentReminders.tasks.map((task) => (task.id === editingTaskId ? taskToAdd : task))
        : [...currentReminders.tasks, taskToAdd],
    }));

    saveStoredTask(taskToAdd, editingTaskId);
    setNewTask(emptyTask);
    setEditingTaskId(null);
    setActiveQuickForm('');
  }

  function handleAddMedication(event) {
    event.preventDefault();

    const medicationToAdd = normalizeMedicationForStorage(newMedication);

    if (!medicationToAdd.name) {
      return;
    }

    const savedMedication = {
      ...medicationToAdd,
      id: Date.now(),
      confirmed: false,
      confirmedDate: '',
      lastTakenAt: '',
      takenHistory: [],
    };

    saveStoredItem(medicationStorageKey, savedMedication);
    setReminders(loadStoredReminders());
    setNewMedication(emptyMedication);
    setActiveQuickForm('');
  }

  function editTask(taskId) {
    const task = reminders.tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
      return;
    }

    setEditingTaskId(taskId);
    setNewTask({
      title: task.title || task.name || '',
      date: task.rawDate || '',
      time: getInputTimeValue(task.time),
      details: task.details || '',
    });
    setActiveQuickForm('task');
  }

  function handleAddAppointment(event) {
    event.preventDefault();

    if (!clean(newAppointment.provider) && !clean(newAppointment.reason)) {
      return;
    }

    const appointmentToAdd = normalizeAppointmentForStorage(newAppointment);

    const savedAppointment = {
      ...appointmentToAdd,
      id: Date.now(),
      confirmed: false,
    };

    saveStoredItem(appointmentStorageKey, savedAppointment);
    setReminders(loadStoredReminders());
    setNewAppointment(emptyAppointment);
    setActiveQuickForm('');
  }


  return (
    <div className="homepage">
      <a className="skip-link" href="#main-content">
        Skip to reminders
      </a>

      <header className="hero">
        <div className="hero-top">
        <div>
          <h1 className="eyebrow">
            <Link to="/home" className="title-link">
              Flow State
            </Link>
          </h1>
          <h2>Welcome, {username}!</h2>
          
        </div>

        <div className="today-summary" aria-label="Today progress">
          <span>{completedCount}</span>
          <p>of {totalCount} reminders confirmed</p>
        </div>
      </div>

  <nav className="hero-nav">
    <Link to="/home" className="nav-tab active">Home</Link>
    <Link to="/medications" className="nav-tab">Medications</Link>
    <Link to="/appointments" className="nav-tab">Appointments</Link>
    <Link to="/tasks" className="nav-tab">Settings</Link>
    <button onClick={handleLogout} className="logout-button">
  Log Out
</button>
  </nav>
</header>

      <main id="main-content" className="dashboard">
        {dueMedications.length > 0 && (
          <section className="medicine-alert" aria-live="assertive" aria-labelledby="medicine-alert-title">
            <div>
              <p className="reminder-type">Medicine due now</p>
              <h2 id="medicine-alert-title">Time to take your medicine</h2>
              <p>
                {dueMedications
                  .map((medication) => `${medication.name} at ${medication.time}`)
                  .join(', ')}
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
                  onClick={() => handleConfirm('medications', medication.id)}
                >
                  I took {medication.name}
                </button>
              ))}
              <Link to="/medications" className="alert-link">
                View medicines
              </Link>
            </div>
          </section>
        )}

        <section className="focus-create-links" aria-labelledby="focus-create-title">
          <div>
            <h2 className="reminder-type">Create reminders</h2>
          </div>
          <div className="focus-create-actions">
            <button
              className="alert-link task-create-button"
              type="button"
              onClick={() => showQuickForm('medication')}
            >
              Add medication
            </button>
            <button
              className="alert-link task-create-button"
              type="button"
              onClick={() => showQuickForm('appointment')}
            >
              Add appointment
            </button>
            <button
              className="alert-link task-create-button"
              type="button"
              onClick={() => showQuickForm('task')}
            >
              Add task
            </button>
          </div>
        </section>

        {activeQuickForm === 'medication' && (
          <section className="app-section quick-entry-form" aria-labelledby="quick-medication-title">
            <div className="section-heading">
              <p>Medication</p>
              <h2 id="quick-medication-title">Add a medication</h2>
            </div>

            <form onSubmit={handleAddMedication}>
              <label htmlFor="quick-medication-name">Medication name</label>
              <input
                id="quick-medication-name"
                name="name"
                type="text"
                value={newMedication.name}
                onChange={handleMedicationChange}
                placeholder="Example: Lisinopril"
                required
              />

              <label htmlFor="quick-medication-purpose">What it is for</label>
              <input
                id="quick-medication-purpose"
                name="purpose"
                type="text"
                value={newMedication.purpose}
                onChange={handleMedicationChange}
                placeholder="Example: blood pressure"
              />

              <label htmlFor="quick-medication-dosage">Dosage</label>
              <input
                id="quick-medication-dosage"
                name="dosage"
                type="text"
                value={newMedication.dosage}
                onChange={handleMedicationChange}
                placeholder="Example: 10 mg"
              />

              <label htmlFor="quick-medication-frequency">Frequency</label>
              <select
                id="quick-medication-frequency"
                name="frequency"
                value={newMedication.frequency}
                onChange={handleMedicationChange}
              >
                <option>Once daily</option>
                <option>Twice daily</option>
                <option>Three times daily</option>
                <option>Every other day</option>
                <option>As needed</option>
                <option>Custom</option>
              </select>

              <label htmlFor="quick-medication-time">Time</label>
              <input
                id="quick-medication-time"
                name="time"
                type="time"
                value={newMedication.time}
                onChange={handleMedicationChange}
              />

              <label htmlFor="quick-medication-date">Date</label>
              <input
                id="quick-medication-date"
                name="date"
                type="date"
                value={newMedication.date}
                onChange={handleMedicationChange}
              />

              <label htmlFor="quick-medication-instructions">Instructions</label>
              <textarea
                id="quick-medication-instructions"
                name="instructions"
                value={newMedication.instructions}
                onChange={handleMedicationChange}
                placeholder="Example: take with food"
                rows="3"
              />

              <label htmlFor="quick-medication-reminder-delay">If missed, remind again after</label>
              <select
                id="quick-medication-reminder-delay"
                name="reminderDelayMinutes"
                value={newMedication.reminderDelayMinutes}
                onChange={handleMedicationChange}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
              </select>

              <div className="task-form-actions">
                <button className="primary-button" type="submit">
                  Save medication
                </button>
                <button
                  className="secondary-task-button"
                  type="button"
                  onClick={() => {
                    setNewMedication(emptyMedication);
                    setActiveQuickForm('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {activeQuickForm === 'appointment' && (
          <section className="app-section quick-entry-form" aria-labelledby="quick-appointment-title">
            <div className="section-heading">
              <p>Appointment</p>
              <h2 id="quick-appointment-title">Add an appointment</h2>
            </div>

            <form onSubmit={handleAddAppointment}>
              <label htmlFor="quick-appointment-provider">Doctor, clinic, or provider</label>
              <input
                id="quick-appointment-provider"
                name="provider"
                type="text"
                value={newAppointment.provider}
                onChange={handleAppointmentChange}
                placeholder="Example: Dr. Smith"
              />

              <label htmlFor="quick-appointment-reason">Reason for visit</label>
              <input
                id="quick-appointment-reason"
                name="reason"
                type="text"
                value={newAppointment.reason}
                onChange={handleAppointmentChange}
                placeholder="Example: blood pressure check"
              />

              <label htmlFor="quick-appointment-date">Date</label>
              <input
                id="quick-appointment-date"
                name="date"
                type="date"
                value={newAppointment.date}
                onChange={handleAppointmentChange}
              />

              <label htmlFor="quick-appointment-time">Time</label>
              <input
                id="quick-appointment-time"
                name="time"
                type="time"
                value={newAppointment.time}
                onChange={handleAppointmentChange}
              />

              <label htmlFor="quick-appointment-location">Location</label>
              <input
                id="quick-appointment-location"
                name="location"
                type="text"
                value={newAppointment.location}
                onChange={handleAppointmentChange}
                placeholder="Example: Main Street Clinic"
              />

              <label htmlFor="quick-appointment-notes">Helpful notes</label>
              <textarea
                id="quick-appointment-notes"
                name="notes"
                value={newAppointment.notes}
                onChange={handleAppointmentChange}
                placeholder="Example: bring insurance card"
                rows="3"
              />

              <label htmlFor="quick-appointment-reminder">Remind me before</label>
              <select
                id="quick-appointment-reminder"
                name="reminderBeforeMinutes"
                value={newAppointment.reminderBeforeMinutes}
                onChange={handleAppointmentChange}
              >
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
              </select>

              <div className="task-form-actions">
                <button className="primary-button" type="submit">
                  Save appointment
                </button>
                <button
                  className="secondary-task-button"
                  type="button"
                  onClick={() => {
                    setNewAppointment(emptyAppointment);
                    setActiveQuickForm('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {activeQuickForm === 'task' && (
          <section className="app-section quick-entry-form" aria-labelledby="quick-task-title">
            <div className="section-heading">
              <p>Task</p>
              <h2 id="quick-task-title">Add a task</h2>
            </div>

            <form onSubmit={handleAddTask}>
              <label htmlFor="task-title">Task name</label>
              <input
                id="task-title"
                name="title"
                type="text"
                value={newTask.title}
                onChange={handleTaskChange}
                placeholder="Example: Drink water"
                required
              />

              <label htmlFor="task-time">Time</label>
              <input
                id="task-time"
                name="time"
                type="time"
                value={newTask.time}
                onChange={handleTaskChange}
              />

              <label htmlFor="task-date">Date</label>
              <input
                id="task-date"
                name="date"
                type="date"
                value={newTask.date}
                onChange={handleTaskChange}
              />

              <label htmlFor="task-details">Helpful note</label>
              <textarea
                id="task-details"
                name="details"
                value={newTask.details}
                onChange={handleTaskChange}
                placeholder="Add simple instructions"
                rows="3"
              />

              <div className="task-form-actions">
                <button className="primary-button" type="submit">
                  {editingTaskId ? 'Save changes' : 'Save task'}
                </button>
                <button
                  className="secondary-task-button"
                  type="button"
                  onClick={() => {
                    setNewTask(emptyTask);
                    setEditingTaskId(null);
                    setActiveQuickForm('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <MedicationReminders
          medications={reminders.medications}
          onConfirm={(id) => handleConfirm('medications', id)}
          onEdit={() => navigate('/medications')}
        />
        <AppointmentReminders
          appointments={reminders.appointments}
          onConfirm={(id) => handleConfirm('appointments', id)}
          onDelete={handleDeleteAppointment}
          onEdit={() => navigate('/appointments')}
        />
        <TaskReminders
          tasks={dailyChecklistItems}
          onConfirm={handleConfirm}
          onDeleteAppointment={handleDeleteAppointment}
          onEditTask={editTask}
          onEditMedication={() => navigate('/medications')}
          onEditAppointment={() => navigate('/appointments')}
        />
      </main>
    </div>
  );
}

export default Homepage;

function loadStoredReminders() {
  return {
    ...initialReminders,
    medications: loadStoredMedications(),
    appointments: loadStoredAppointments(),
    tasks: loadStoredTasks(),
  };
}

function loadStoredMedications() {
  return readStorageList(medicationStorageKey)
    .map((medication) => {
      const timing = getMedicationTiming(medication.times);
      const confirmedToday = isConfirmedToday(medication);
      const isSnoozed = Boolean(medication.snoozedUntil && new Date(medication.snoozedUntil) > new Date());
      const isDue = Boolean(timing.dueDose && !confirmedToday && !isSnoozed);

      return {
        id: medication.id,
        name: medication.name,
        title: medication.name,
        time: formatReminderDateTime(
          medication.rawDate,
          timing.displayDose?.label || medication.times || ''
        ),
        instructions: medication.instructions || 'No instructions listed.',
        details: isDue
          ? `DUE NOW: ${medication.instructions || 'Take as instructed.'}`
          : confirmedToday && medication.lastTakenAt && hasMultipleDailyDoses(medication)
          ? `Last taken today at ${medication.lastTakenAt}`
          : medication.instructions || 'No instructions listed.',
        confirmed: confirmedToday,
        isDue,
        category: 'medications',
        type: isDue ? 'Medicine due now' : 'Medicine',
        sortTime: getSortTime(timing.displayDose?.label || medication.times),
      };
    })
    .filter((medication) => !medication.confirmed);
}

function loadStoredAppointments() {
  return readStorageList(appointmentStorageKey)
    .filter((appointment) => !isPastAppointment(appointment))
    .map((appointment) => ({
      id: appointment.id,
      title: appointment.provider || 'Appointment',
      time: [appointment.date, appointment.time].filter(Boolean).join(' at ') || 'Time not listed',
      details: [
        appointment.reason || appointment.location || 'No details listed.',
        appointment.reminderBeforeMinutes
          ? `Reminder: ${formatMinutesLabel(appointment.reminderBeforeMinutes)} before`
          : '',
      ]
        .filter(Boolean)
        .join(' | '),
      confirmed: Boolean(appointment.confirmed),
      category: 'appointments',
      type: 'Appointment',
      rawDate: appointment.rawDate,
      sortTime: getSortTime(appointment.time),
    }));
}

function loadStoredTasks() {
  return readStorageList(taskStorageKey).map((task) => ({
    id: task.id,
    title: task.title || task.name || 'Task',
    name: task.name || task.title || 'Task',
    date: task.date || '',
    rawDate: task.rawDate || '',
    time: formatReminderDateTime(task.rawDate, task.time),
    details: task.details || 'No extra notes added.',
    instructions: task.instructions || task.details || 'No extra instructions added.',
    confirmed: Boolean(task.confirmed),
    category: 'tasks',
    type: 'Task reminder',
    sortTime: getSortTime(task.time),
  }));
}

function getDailyChecklistItems(reminders) {
  const medicationItems = reminders.medications
    .filter((medication) => isReminderForToday(medication))
    .map((medication) => ({
      ...medication,
      category: 'medications',
      type: medication.isDue ? 'Medicine due now' : 'Medicine',
    }));

  const appointmentItems = reminders.appointments
    .filter((appointment) => isAppointmentForToday(appointment))
    .map((appointment) => ({
      ...appointment,
      category: 'appointments',
      type: 'Appointment',
    }));

  const taskItems = reminders.tasks
    .filter((task) => isReminderForToday(task))
    .map((task) => ({
      ...task,
      category: 'tasks',
      type: 'Task reminder',
      sortTime: getSortTime(task.time),
    }));

  return [...medicationItems, ...appointmentItems, ...taskItems].sort(
    (firstItem, secondItem) => firstItem.sortTime - secondItem.sortTime
  );
}

function isAppointmentForToday(appointment) {
  if (!appointment.rawDate) {
    return true;
  }

  return appointment.rawDate === getTodayKey();
}

function isReminderForToday(reminder) {
  if (!reminder.rawDate) {
    return true;
  }

  return reminder.rawDate === getTodayKey();
}

function getSortTime(time) {
  const match = String(time || '').match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'am' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function readStorageList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function toggleStoredItemConfirmed(key, id) {
  const updatedItems = readStorageList(key).map((item) =>
    item.id === id ? getToggledItem(key, item) : item
  );

  localStorage.setItem(key, JSON.stringify(updatedItems));
  window.dispatchEvent(new Event(dataChangeEvent));
}

function deleteStoredItem(key, id) {
  const remainingItems = readStorageList(key).filter((item) => item.id !== id);

  localStorage.setItem(key, JSON.stringify(remainingItems));
  window.dispatchEvent(new Event(dataChangeEvent));
}

function saveStoredTask(task, existingTaskId = null) {
  if (!existingTaskId) {
    saveStoredItem(taskStorageKey, task);
    return;
  }

  localStorage.setItem(
    taskStorageKey,
    JSON.stringify(
      readStorageList(taskStorageKey).map((storedTask) =>
        storedTask.id === existingTaskId ? task : storedTask
      )
    )
  );
  window.dispatchEvent(new Event(dataChangeEvent));
}

function saveStoredItem(key, item) {
  localStorage.setItem(key, JSON.stringify([...readStorageList(key), item]));
  window.dispatchEvent(new Event(dataChangeEvent));
}

function getToggledItem(key, item) {
  const nextConfirmed = !item.confirmed;

  if (key === medicationStorageKey) {
    return {
      ...item,
      confirmed: nextConfirmed,
      confirmedDate: nextConfirmed ? getTodayKey() : '',
      lastTakenAt: nextConfirmed ? formatTakenTime(new Date()) : '',
      snoozedUntil: '',
      takenHistory: nextConfirmed
        ? [
            {
              date: getTodayKey(),
              time: formatTakenTime(new Date()),
              timestamp: new Date().toISOString(),
            },
            ...(item.takenHistory || []),
          ].slice(0, 10)
        : item.takenHistory || [],
    };
  }

  return {
    ...item,
    confirmed: nextConfirmed,
  };
}

function normalizeMedicationForStorage(medication) {
  return {
    name: clean(medication.name),
    purpose: clean(medication.purpose) || 'Not listed',
    dosage: clean(medication.dosage) || 'Not listed',
    frequency: clean(medication.frequency) || 'Not listed',
    times: clean(medication.time) ? formatStoredTime(medication.time) : 'Not listed',
    rawDate: clean(medication.date),
    date: formatDate(medication.date) || '',
    instructions: clean(medication.instructions) || 'Not listed',
    sideEffects: 'Not listed',
    reminderDelayMinutes: Number(medication.reminderDelayMinutes) || 30,
    takenHistory: [],
    snoozedUntil: '',
  };
}

function normalizeAppointmentForStorage(appointment) {
  return {
    provider: clean(appointment.provider) || 'Appointment',
    reason: clean(appointment.reason) || 'Not listed',
    date: formatDate(appointment.date) || 'Not listed',
    time: clean(appointment.time) ? formatStoredTime(appointment.time) : 'Not listed',
    rawDate: clean(appointment.date),
    rawTime: clean(appointment.time),
    location: clean(appointment.location) || 'Not listed',
    transportation: 'Not listed',
    notes: clean(appointment.notes) || 'Not listed',
    reminderBeforeMinutes: Number(appointment.reminderBeforeMinutes) || 30,
  };
}

function clean(value) {
  return String(value || '').trim();
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatReminderDateTime(date, time) {
  const formattedDate = formatDate(date);
  const formattedTime = time || 'Any time today';

  return [formattedDate, formattedTime].filter(Boolean).join(' at ');
}

function formatStoredTime(time) {
  if (!time) {
    return '';
  }

  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getInputTimeValue(time) {
  const match = String(time || '').match(/(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);

  if (!match) {
    return '';
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'am' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatMinutesLabel(minutes) {
  return Number(minutes) === 60 ? '1 hour' : `${minutes} minutes`;
}

function getMedicationTiming(times) {
  const parsedTimes = parseMedicationTimes(times);

  if (parsedTimes.length === 0) {
    return {
      dueDose: null,
      nextDose: null,
      displayDose: null,
    };
  }

  const now = new Date();
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
  const matches = String(times || '').match(/\d{1,2}(:\d{2})?\s?(am|pm)?/gi) || [];

  return matches
    .map((value) => {
      const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s?(am|pm)?$/i);

      if (!match) {
        return null;
      }

      let hours = Number(match[1]);
      const minutes = Number(match[2] || 0);
      const meridiem = match[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) {
        hours += 12;
      }

      if (meridiem === 'am' && hours === 12) {
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
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTakenTime(date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isPastAppointment(appointment) {
  if (!appointment.rawDate || !appointment.rawTime) {
    return false;
  }

  const appointmentDate = new Date(`${appointment.rawDate}T${appointment.rawTime}`);

  return appointmentDate < new Date();
}

function isConfirmedToday(medication) {
  return Boolean(medication.confirmed && medication.confirmedDate === getTodayKey());
}

function hasMultipleDailyDoses(medication) {
  return (
    parseMedicationTimes(medication.times).length > 1 ||
    /twice|three times|multiple/i.test(medication.frequency || '')
  );
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
