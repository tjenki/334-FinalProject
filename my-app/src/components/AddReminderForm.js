function AddReminderForm({ newReminder, onChange, onSubmit }) {
  return (
    <section className="app-section add-reminder" aria-labelledby="add-reminder-heading">
      <div className="section-heading">
        <p>Add reminder</p>
        <h2 id="add-reminder-heading">Create a simple reminder</h2>
      </div>

      <form onSubmit={onSubmit}>
        <label htmlFor="reminder-title">Reminder name</label>
        <input
          id="reminder-title"
          name="title"
          type="text"
          value={newReminder.title}
          onChange={onChange}
          placeholder="Example: Drink water"
          required
        />

        <label htmlFor="reminder-time">Time</label>
        <input
          id="reminder-time"
          name="time"
          type="time"
          value={newReminder.time}
          onChange={onChange}
          required
        />

        <label htmlFor="reminder-category">Category</label>
        <select
          id="reminder-category"
          name="category"
          value={newReminder.category}
          onChange={onChange}
        >
          <option value="tasks">Task</option>
          <option value="medications">Medication</option>
          <option value="appointments">Appointment</option>
        </select>

        <label htmlFor="reminder-details">Helpful note</label>
        <textarea
          id="reminder-details"
          name="details"
          value={newReminder.details}
          onChange={onChange}
          placeholder="Add simple instructions"
          rows="3"
        />

        <button className="primary-button" type="submit">
          Add reminder
        </button>
      </form>
    </section>
  );
}

export default AddReminderForm;
