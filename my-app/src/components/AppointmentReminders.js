import ReminderCard from './ReminderCard';

function AppointmentReminders({ appointments, onConfirm, onDelete }) {
  return (
    <section className="app-section appointment-reminders-section" aria-labelledby="appointment-heading">
      <div className="section-heading">
        <p>Appointments</p>
        <h2 id="appointment-heading">Upcoming visits</h2>
      </div>

      <div className="reminder-list">
        {appointments.map((appointment) => (
          <ReminderCard
            key={appointment.id}
            title={appointment.title}
            time={appointment.time}
            details={appointment.details}
            type="Appointment reminder"
            isConfirmed={appointment.confirmed}
            onConfirm={() => onConfirm(appointment.id)}
            onDelete={() => onDelete(appointment.id)}
            alwaysShowDelete
          />
        ))}
      </div>
    </section>
  );
}

export default AppointmentReminders;
