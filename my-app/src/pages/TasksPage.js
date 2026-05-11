import { Link } from "react-router-dom";

function TasksPage() {
  return (
    <div>
      <header className="hero">
        <div className="hero-top">
          <div>
            <h1 className="eyebrow">
              <Link to="/" className="title-link-medication-page">
                Tasks
              </Link>
            </h1>


          </div>
        </div>
      </header>
    </div>
  );
}

export default TasksPage;