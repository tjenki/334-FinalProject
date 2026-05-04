function MedicationReminder({ reminder, details, onConfirmTaken, onMarkDone, onRemove }) {
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
        {reminder.needsConfirmation && reminder.status !== 'Confirmed' && (
          <button className="secondary-button" type="button" onClick={onConfirmTaken}>
            Confirm taken
          </button>
        )}
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

export default MedicationReminder;
