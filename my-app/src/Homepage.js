import './Homepage.css';
import { useMemo, useState } from 'react';
import AddReminderForm from './components/AddReminderForm';
import AppointmentReminders from './components/AppointmentReminders';
import MedicationReminders from './components/MedicationReminders';
import TaskReminders from './components/TaskReminders';
import { Link } from 'react-router-dom';


const initialReminders = {
  medications: [
    /* Example: 
     id: 1,
      title: 'Vitamin',
      time: 'Tomorrow, 10:30 AM',
      details: 'Take Vitamin D and B.',
      confirmed: false,
    */
  ],
  appointments: [],
  tasks: [],
};

const emptyReminder = {
  title: '',
  time: '',
  category: 'tasks',
  details: '',
};


function Homepage() {
  const [reminders, setReminders] = useState(initialReminders);
  const [newReminder, setNewReminder] = useState(emptyReminder);

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

  function handleConfirm(category, reminderId) {
    setReminders((currentReminders) => ({
      ...currentReminders,
      [category]: currentReminders[category].map((reminder) =>
        reminder.id === reminderId
          ? { ...reminder, confirmed: !reminder.confirmed }
          : reminder
      ),
    }));
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
            <Link to="/" className="title-link">
              Everyday Tracker
            </Link>
          </h1>
          
        </div>

        <div className="today-summary" aria-label="Today progress">
          <span>{completedCount}</span>
          <p>of {totalCount} reminders confirmed</p>
        </div>
      </div>

  <nav className="hero-nav">
    <Link to="/" className="nav-tab active">Home</Link>
    <Link to="/medications" className="nav-tab">Medications</Link>
    <Link to="/appointments" className="nav-tab">Appointments</Link>
    <Link to="/tasks" className="nav-tab">Tasks</Link>
  </nav>
</header>

      <main id="main-content" className="dashboard">
        <MedicationReminders
          medications={reminders.medications}
          onConfirm={(id) => handleConfirm('medications', id)}
        />
        <AppointmentReminders
          appointments={reminders.appointments}
          onConfirm={(id) => handleConfirm('appointments', id)}
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
