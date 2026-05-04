function HeroSummary({ pendingCount, confirmedCount, completedCount }) {
  return (
    <section className="hero-section" aria-labelledby="app-title">
      <div className="hero-copy">
        <p className="eyebrow">Everyday reminder app</p>
        <h1 id="app-title">Simple reminders for medication, appointments, and tasks.</h1>
        <p className="hero-text">
          Keep the day organized with clear alerts, pill confirmation, and an easy view of
          what still needs attention.
        </p>
      </div>

      <div className="today-card" aria-label="Today's reminder summary">
        <div>
          <span className="summary-number">{pendingCount}</span>
          <span className="summary-label">Pending</span>
        </div>
        <div>
          <span className="summary-number">{confirmedCount}</span>
          <span className="summary-label">Confirmed</span>
        </div>
        <div>
          <span className="summary-number">{completedCount}</span>
          <span className="summary-label">Done</span>
        </div>
      </div>
    </section>
  );
}

export default HeroSummary;
