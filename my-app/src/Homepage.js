import './Homepage.css';
import { useMemo, useState } from 'react';
import AddReminderForm from './components/AddReminderForm';
import AppointmentReminders from './components/AppointmentReminders';
import MedicationReminders from './components/MedicationReminders';
import TaskReminders from './components/TaskReminders';

const initialReminders = {
  medications: [
    {
      id: 1,
      name: 'Morning blood pressure pill',
      time: '8:00 AM',
      instructions: 'Take 1 pill with breakfast.',
      confirmed: false,
    },
    {
      id: 2,
      name: 'Evening vitamins',
      time: '7:00 PM',
      instructions: 'Take after dinner with water.',
      confirmed: true,
    },
  ],
  appointments: [
    {
      id: 1,
      title: 'Physical therapy',
      time: 'Tomorrow, 10:30 AM',
      details: 'Bring exercise band and water bottle.',
      confirmed: false,
    },
  ],
  tasks: [
    {
      id: 1,
      title: 'Pack lunch',
      time: '7:30 AM',
      details: 'Use the blue lunch bag from the kitchen.',
      confirmed: false,
    },
    {
      id: 2,
      title: 'Call caregiver',
      time: '4:00 PM',
      details: 'Quick check-in before dinner.',
      confirmed: false,
    },
  ],
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
        <div>
          <p className="eyebrow">Everyday Tracker</p>
          <h1>Simple reminders for medicine, appointments, and daily tasks.</h1>
          <p className="hero-text">
            A calm, accessible dashboard that keeps important responsibilities easy
            to see, confirm, and complete.
          </p>
        </div>

        <div className="today-summary" aria-label="Today progress">
          <span>{completedCount}</span>
          <p>of {totalCount} reminders confirmed</p>
        </div>
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
