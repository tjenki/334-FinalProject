import ReminderCard from './ReminderCard';

function TaskReminders({ tasks, onConfirm, onDeleteAppointment, onEditTask, onEditMedication, onEditAppointment }) {
  return (
    <section className="app-section daily-checklist-section" aria-labelledby="task-heading">
      <div className="section-heading">
        <p>Today</p>
        <h2 id="task-heading">Daily checklist</h2>
      </div>

      <div className="reminder-list">
        {tasks.map((task) => (
          <ReminderCard
            key={`${task.category}-${task.id}`}
            title={task.title}
            time={task.time}
            details={task.details}
            type={task.type}
            isConfirmed={task.confirmed}
            onConfirm={() => onConfirm(task.category, task.id)}
            onEdit={
              task.category === 'tasks'
                ? () => onEditTask(task.id)
                : task.category === 'medications'
                ? () => onEditMedication(task.id)
                : () => onEditAppointment(task.id)
            }
            onDelete={
              task.category === 'appointments'
                ? () => onDeleteAppointment(task.id)
                : undefined
            }
            alwaysShowDelete={task.category === 'appointments'}
          />
        ))}
      </div>
    </section>
  );
}

export default TaskReminders;
