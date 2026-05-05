import ReminderCard from './ReminderCard';

function TaskReminders({ tasks, onConfirm }) {
  return (
    <section className="app-section" aria-labelledby="task-heading">
      <div className="section-heading">
        <p>Tasks</p>
        <h2 id="task-heading">Daily checklist</h2>
      </div>

      <div className="reminder-list">
        {tasks.map((task) => (
          <ReminderCard
            key={task.id}
            title={task.title}
            time={task.time}
            details={task.details}
            type="Task reminder"
            isConfirmed={task.confirmed}
            onConfirm={() => onConfirm(task.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default TaskReminders;
