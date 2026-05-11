import { Link } from "react-router-dom";

function MedicationsPage() {
  return (
    <div>
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1 className="eyebrow">
              <Link to="/" className="title-link-medication-page">
                Medications 
              </Link>
            </h1>


            <p>List of medications will appear here.</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default MedicationsPage;