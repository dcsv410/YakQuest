import {
  ABOUT_ATTRIBUTIONS,
  ABOUT_INTRODUCTION,
  ABOUT_LEGAL_NOTE,
  ABOUT_SECTIONS,
  YAKQUEST_CONTACT_EMAIL,
  YAKQUEST_COPYRIGHT_YEAR,
  YAKQUEST_NAME,
  YAKQUEST_TAGLINE,
  YAKQUEST_WEBSITE,
} from "@yakquest/shared";

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="eyebrow">
          About YakQuest
        </p>

        <h1>{YAKQUEST_NAME}</h1>

        <p className="about-tagline">
          {YAKQUEST_TAGLINE}
        </p>

        <div className="about-introduction">
          {ABOUT_INTRODUCTION.map(
            (paragraph) => (
              <p key={paragraph}>
                {paragraph}
              </p>
            )
          )}
        </div>
      </section>

      <section className="about-highlight">
        <div>
          <span className="about-highlight-icon">
            🛶
          </span>

          <div>
            <h2>
              Plan carefully. Paddle
              responsibly.
            </h2>

            <p>
              YakQuest provides planning
              information, but the final
              decision to launch always
              belongs to the paddler.
            </p>
          </div>
        </div>
      </section>

      <div className="about-content">
        {ABOUT_SECTIONS.map(
          (section) => (
            <section
              key={section.id}
              id={section.id}
              className="about-section"
            >
              <h2>{section.title}</h2>

              {section.paragraphs.map(
                (paragraph) => (
                  <p key={paragraph}>
                    {paragraph}
                  </p>
                )
              )}
            </section>
          )
        )}

        <section
          id="attributions"
          className="about-section"
        >
          <h2>
            Data Sources and Attributions
          </h2>

          <div className="about-attribution-list">
            {ABOUT_ATTRIBUTIONS.map(
              (attribution) => (
                <article
                  key={attribution.name}
                  className="about-attribution"
                >
                  <h3>
                    {attribution.name}
                  </h3>

                  <p>
                    {attribution.description}
                  </p>

                  <a
                    href={attribution.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {attribution.linkLabel}
                  </a>
                </article>
              )
            )}
          </div>

          <p className="about-legal-note">
            {ABOUT_LEGAL_NOTE}
          </p>
        </section>

        <section
          id="contact"
          className="about-section about-contact"
        >
          <h2>Contact YakQuest</h2>

          <p>
            Questions, corrections, safety
            concerns, copyright concerns,
            and support requests may be
            sent to:
          </p>

          <a
            className="about-contact-email"
            href={
              `mailto:${YAKQUEST_CONTACT_EMAIL}`
            }
          >
            {YAKQUEST_CONTACT_EMAIL}
          </a>

          <p>
            Website:{" "}
            <a
              href={YAKQUEST_WEBSITE}
              target="_blank"
              rel="noreferrer"
            >
              yakquest.com
            </a>
          </p>
        </section>
      </div>

      <footer className="about-footer">
        <p>
          © {YAKQUEST_COPYRIGHT_YEAR}{" "}
          {YAKQUEST_NAME}. All rights
          reserved.
        </p>

        <p>
          Built to help paddlers plan more
          confidently and enjoy waterways
          responsibly.
        </p>
      </footer>
    </main>
  );
}