function ReminderForm({ formData, onInputChange, onAddReminder }) {
  return (
    <form className="reminder-form" onSubmit={onAddReminder}>
      <div className="section-heading">
        <p className="eyebrow">Add reminder</p>
        <h2>Create a new alert</h2>
      </div>

      <label>
        Reminder name
        <input
          name="title"
          type="text"
          placeholder="Example: Take vitamin D"
          value={formData.title}
          onChange={onInputChange}
        />
      </label>

      <div className="form-row">
        <label>
          Category
          <select name="category" value={formData.category} onChange={onInputChange}>
            <option>Medication</option>
            <option>Appointment</option>
            <option>Task</option>
          </select>
        </label>

        <label>
          Time
          <input
            name="time"
            type="text"
            placeholder="9:00 AM"
            value={formData.time}
            onChange={onInputChange}
          />
        </label>
      </div>

      <label>
        Notes
        <textarea
          name="notes"
          placeholder="Add dosage, location, or task details"
          value={formData.notes}
          onChange={onInputChange}
        />
      </label>

      {formData.category === 'Medication' && (
        <label className="checkbox-label">
          <input
            name="needsConfirmation"
            type="checkbox"
            checked={formData.needsConfirmation}
            onChange={onInputChange}
          />
          Require pill confirmation
        </label>
      )}

      <button className="primary-button" type="submit">
        Add reminder
      </button>
    </form>
  );
}

export default ReminderForm;
