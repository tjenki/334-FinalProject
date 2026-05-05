function ReminderCard({ title, time, details, type, isConfirmed, onConfirm }) {
  return (
    <article className={`reminder-card ${isConfirmed ? 'is-confirmed' : ''}`}>
      <div>
        <p className="reminder-type">{type}</p>
        <h3>{title}</h3>
        <p className="reminder-time">{time}</p>
        <p>{details}</p>
      </div>

      <button
        className="confirmation-button"
        type="button"
        onClick={onConfirm}
        aria-pressed={isConfirmed}
      >
        {isConfirmed ? 'Confirmed' : 'Confirm done'}
      </button>
    </article>
  );
}

export default ReminderCard;
