import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-card">
        <p className="eyebrow">Canoe & Kayak Trip Planner</p>
        <h1>Plan your paddle before you launch.</h1>
        <p className="hero-text">
          Browse rivers, choose launch and takeout points, review flow
          conditions, and print a simple trip plan.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/plan">
            Plan a Trip
          </Link>
          <Link className="secondary-button" to="/rivers">
            Browse Rivers
          </Link>
        </div>
      </div>
    </section>
  );
}