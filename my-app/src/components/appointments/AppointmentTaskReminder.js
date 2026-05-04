function AppointmentTaskReminder({ reminder, details, onMarkDone, onRemove }) {
  return (
    <article className={`reminder-card ${details.accent}`}>
      <div className="reminder-topline">
        <span className="category-pill">{details.label}</span>
        <span className={`status-badge ${reminder.status.toLowerCase()}`}>
          {reminder.status}
        </span>
      </div>

      <h3>{reminder.title}</h3>
      <p className="reminder-time">{reminder.time}</p>
      <p className="reminder-notes">{reminder.notes}</p>

      <div className="card-actions">
        {reminder.status !== 'Done' && (
          <button className="secondary-button" type="button" onClick={onMarkDone}>
            Mark done
          </button>
        )}
        <button className="ghost-button" type="button" onClick={onRemove}>
          Remove
        </button>
      </div>
    </article>
  );
}

export default AppointmentTaskReminder;
