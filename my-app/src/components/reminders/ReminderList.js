import AppointmentTaskReminder from '../appointments/AppointmentTaskReminder';
import MedicationReminder from '../medication/MedicationReminder';

function ReminderList({ reminders, activeFilter, categoryDetails, onFilterChange, onUpdateStatus, onRemove }) {
  return (
    <section className="reminder-panel">
      <div className="panel-header">
        <div className="section-heading">
          <p className="eyebrow">Today</p>
          <h2>Reminder schedule</h2>
        </div>

        <div className="filter-group" aria-label="Filter reminders">
          {['All', 'Medication', 'Appointment', 'Task'].map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? 'filter-button active' : 'filter-button'}
              type="button"
              onClick={() => onFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="reminder-list">
        {reminders.map((reminder) => {
          const details = categoryDetails[reminder.category];
          const sharedProps = {
            reminder,
            details,
            onMarkDone: () => onUpdateStatus(reminder.id, 'Done'),
            onRemove: () => onRemove(reminder.id),
          };

          if (reminder.category === 'Medication') {
            return (
              <MedicationReminder
                key={reminder.id}
                {...sharedProps}
                onConfirmTaken={() => onUpdateStatus(reminder.id, 'Confirmed')}
              />
            );
          }

          return <AppointmentTaskReminder key={reminder.id} {...sharedProps} />;
        })}
      </div>
    </section>
  );
}

export default ReminderList;
