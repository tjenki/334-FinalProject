import ReminderCard from './ReminderCard';

function MedicationReminders({ medications, onConfirm, onEdit }) {
  return (
    <section className="app-section medication-reminders-section" aria-labelledby="medication-heading">
      <div className="section-heading">
        <p>Medication</p>
        <h2 id="medication-heading">Today&apos;s medicine</h2>
      </div>

      <div className="reminder-list">
        {medications.map((medicine) => (
          <ReminderCard
            key={medicine.id}
            title={medicine.name}
            time={medicine.time}
            details={medicine.instructions}
            type={medicine.isDue ? 'Medicine due now' : 'Pill reminder'}
            isConfirmed={medicine.confirmed}
            onConfirm={() => onConfirm(medicine.id)}
            onEdit={() => onEdit(medicine.id)}
            showConfirm={false}
          />
        ))}
      </div>
    </section>
  );
}

export default MedicationReminders;
