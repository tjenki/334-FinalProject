function ReminderCard({
  title,
  time,
  details,
  type,
  isConfirmed,
  onConfirm,
  onDelete,
  alwaysShowDelete = false,
  showConfirm = true,
}) {
  return (
    <article className={`reminder-card ${isConfirmed ? 'is-confirmed' : ''}`}>
      <div>
        <p className="reminder-type">{type}</p>
        <h3>{title}</h3>
        <p className="reminder-time">{time}</p>
        <p>{details}</p>
      </div>

      <div className="reminder-actions">
        {showConfirm && (
          <button
            className="confirmation-button"
            type="button"
            onClick={onConfirm}
            aria-pressed={isConfirmed}
          >
            {isConfirmed ? 'Confirmed' : 'Confirm done'}
          </button>
        )}

        {onDelete && (isConfirmed || alwaysShowDelete) && (
          <button className="delete-reminder-button" type="button" onClick={onDelete}>
            Delete 
          </button>
        )}
      </div>
    </article>
  );
}

export default ReminderCard;
