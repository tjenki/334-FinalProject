import './Homepage.css';
import { useEffect, useMemo, useState } from 'react';
import AddReminderForm from './components/AddReminderForm';
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
const dataChangeEvent = 'everyday-tracker-data-change';

const emptyReminder = {
  title: '',
  time: '',
  category: 'tasks',
  details: '',
};


function Homepage() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const [reminders, setReminders] = useState(() => loadStoredReminders());
  const [newReminder, setNewReminder] = useState(emptyReminder);
  const [soundBlocked, setSoundBlocked] = useState(false);

  useEffect(() => {
    function refreshReminders() {
      setReminders((currentReminders) => ({
        ...loadStoredReminders(),
        tasks: currentReminders.tasks,
      }));
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

  function handleReminderChange(event) {
    const { name, value } = event.target;

    setNewReminder((currentReminder) => ({
      ...currentReminder,
      [name]: value,
    }));
  }

  function formatTime(time) {
    if (!time) {
      return 'Any time today';
    }

    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function handleAddReminder(event) {
    event.preventDefault();

    const reminderToAdd = {
      id: Date.now(),
      title: newReminder.title,
      name: newReminder.title,
      time: formatTime(newReminder.time),
      details: newReminder.details || 'No extra notes added.',
      instructions: newReminder.details || 'No extra instructions added.',
      confirmed: false,
    };

    setReminders((currentReminders) => ({
      ...currentReminders,
      [newReminder.category]: [
        ...currentReminders[newReminder.category],
        reminderToAdd,
      ],
    }));

    if (newReminder.category === 'medications') {
      addStoredMedication(reminderToAdd);
    }

    if (newReminder.category === 'appointments') {
      addStoredAppointment(reminderToAdd);
    }

    setNewReminder(emptyReminder);
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
              Everyday Tracker
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
              <Link to="/medications" className="alert-link">
                View medicines
              </Link>
            </div>
          </section>
        )}

        <MedicationReminders
          medications={reminders.medications}
          onConfirm={(id) => handleConfirm('medications', id)}
        />
        <AppointmentReminders
          appointments={reminders.appointments}
          onConfirm={(id) => handleConfirm('appointments', id)}
          onDelete={handleDeleteAppointment}
        />
        <TaskReminders
          tasks={reminders.tasks}
          onConfirm={(id) => handleConfirm('tasks', id)}
        />
        <AddReminderForm
          newReminder={newReminder}
          onChange={handleReminderChange}
          onSubmit={handleAddReminder}
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
  };
}

function loadStoredMedications() {
  return readStorageList(medicationStorageKey)
    .map((medication) => {
      const timing = getMedicationTiming(medication.times);
      const confirmedToday = isConfirmedToday(medication);
      const isDue = Boolean(timing.dueDose && !confirmedToday);

      return {
        id: medication.id,
        name: medication.name,
        title: medication.name,
        time: timing.displayDose?.label || medication.times || 'Time not listed',
        instructions: medication.instructions || 'No instructions listed.',
        details: isDue
          ? `DUE NOW: ${medication.instructions || 'Take as instructed.'}`
          : medication.instructions || 'No instructions listed.',
        confirmed: confirmedToday,
        isDue,
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
      details: appointment.reason || appointment.location || 'No details listed.',
      confirmed: Boolean(appointment.confirmed),
    }));
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

function getToggledItem(key, item) {
  const nextConfirmed = !item.confirmed;

  if (key === medicationStorageKey) {
    return {
      ...item,
      confirmed: nextConfirmed,
      confirmedDate: nextConfirmed ? getTodayKey() : '',
    };
  }

  return {
    ...item,
    confirmed: nextConfirmed,
  };
}

function addStoredMedication(reminder) {
  const medication = {
    id: reminder.id,
    name: reminder.name,
    purpose: 'Not listed',
    dosage: 'Not listed',
    frequency: 'Custom',
    times: reminder.time,
    instructions: reminder.instructions,
    sideEffects: 'Not listed',
    confirmed: false,
    confirmedDate: '',
  };

  localStorage.setItem(
    medicationStorageKey,
    JSON.stringify([...readStorageList(medicationStorageKey), medication])
  );
  window.dispatchEvent(new Event(dataChangeEvent));
}

function addStoredAppointment(reminder) {
  const appointment = {
    id: reminder.id,
    provider: reminder.title,
    reason: reminder.details,
    date: 'Not listed',
    time: reminder.time,
    rawDate: '',
    rawTime: '',
    location: 'Not listed',
    transportation: 'Not listed',
    notes: reminder.details,
    confirmed: false,
  };

  localStorage.setItem(
    appointmentStorageKey,
    JSON.stringify([...readStorageList(appointmentStorageKey), appointment])
  );
  window.dispatchEvent(new Event(dataChangeEvent));
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

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
