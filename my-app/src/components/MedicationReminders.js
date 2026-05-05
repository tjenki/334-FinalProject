import ReminderCard from './ReminderCard';

function MedicationReminders({ medications, onConfirm }) {
  return (
    <section className="app-section" aria-labelledby="medication-heading">
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
            type="Pill reminder"
            isConfirmed={medicine.confirmed}
            onConfirm={() => onConfirm(medicine.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default MedicationReminders;
