import { useMemo, useState } from 'react';
import './App.css';
import ReminderForm from './components/reminders/ReminderForm';
import ReminderList from './components/reminders/ReminderList';
import HeroSummary from './components/summary/HeroSummary';
import { categoryDetails, starterReminders } from './data/reminders';

function App() {
  const [reminders, setReminders] = useState(starterReminders);
  const [activeFilter, setActiveFilter] = useState('All');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Medication',
    time: '',
    notes: '',
    needsConfirmation: true,
  });

  const filteredReminders = useMemo(() => {
    if (activeFilter === 'All') {
      return reminders;
    }

    return reminders.filter((reminder) => reminder.category === activeFilter);
  }, [activeFilter, reminders]);

  const pendingCount = reminders.filter((reminder) => reminder.status === 'Pending').length;
  const confirmedCount = reminders.filter((reminder) => reminder.status === 'Confirmed').length;
  const completedCount = reminders.filter((reminder) => reminder.status === 'Done').length;

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleAddReminder(event) {
    event.preventDefault();

    const cleanTitle = formData.title.trim();
    const cleanTime = formData.time.trim();

    if (!cleanTitle || !cleanTime) {
      return;
    }

    setReminders((currentReminders) => [
      {
        id: Date.now(),
        title: cleanTitle,
        category: formData.category,
        time: cleanTime,
        notes: formData.notes.trim() || 'No extra notes.',
        status: 'Pending',
        needsConfirmation: formData.category === 'Medication' ? formData.needsConfirmation : false,
      },
      ...currentReminders,
    ]);

    setFormData({
      title: '',
      category: 'Medication',
      time: '',
      notes: '',
      needsConfirmation: true,
    });
  }

  function updateStatus(id, status) {
    setReminders((currentReminders) =>
      currentReminders.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              status,
            }
          : reminder
      )
    );
  }

  function deleteReminder(id) {
    setReminders((currentReminders) =>
      currentReminders.filter((reminder) => reminder.id !== id)
    );
  }

  return (
    <main className="app-shell">
      <HeroSummary
        pendingCount={pendingCount}
        confirmedCount={confirmedCount}
        completedCount={completedCount}
      />

      <section className="content-grid" aria-label="Reminder workspace">
        <ReminderForm
          formData={formData}
          onInputChange={handleInputChange}
          onAddReminder={handleAddReminder}
        />

        <ReminderList
          reminders={filteredReminders}
          activeFilter={activeFilter}
          categoryDetails={categoryDetails}
          onFilterChange={setActiveFilter}
          onUpdateStatus={updateStatus}
          onRemove={deleteReminder}
        />
      </section>
    </main>
  );
}

export default App;
