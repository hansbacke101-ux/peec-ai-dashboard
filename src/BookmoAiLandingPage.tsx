type MockRow = {
  detail: string;
  label: string;
  tone: "blue" | "gold" | "pink";
  value: string;
};

type BookmoAiSection = {
  copy: string;
  eyebrow: string;
  items: string[];
  title: string;
};

const heroRows: MockRow[] = [
  {
    detail: "Leipzig buyer needs a reply today",
    label: "Offer follow-up",
    tone: "gold",
    value: "4h",
  },
  {
    detail: "Festival agreement ready for review",
    label: "Contract status",
    tone: "blue",
    value: "Ready",
  },
  {
    detail: "Hotel and ground transport still open",
    label: "Advancing",
    tone: "pink",
    value: "2 open",
  },
  {
    detail: "Next 48 hours synced to artist view",
    label: "Artist logistics",
    tone: "blue",
    value: "Live",
  },
];

const contentSections: BookmoAiSection[] = [
  {
    copy:
      "Every artist, deal, and deadline lives in one live view. Agents can see what needs action before it turns into another inbox search.",
    eyebrow: "Agency dashboard",
    items: ["Priority queue", "Deal ownership", "Artist context"],
    title: "Know what needs action before your day starts.",
  },
  {
    copy:
      "Follow-ups go out from the right context and stay connected to the buyer, offer, and artist instead of becoming another loose email thread.",
    eyebrow: "Inbox-native reminders",
    items: ["Reply-aware reminders", "Follow-up drafts", "Buyer history"],
    title: "More deals closed. Less time in your inbox.",
  },
  {
    copy:
      "Custom workflows for production, travel, hospitality, settlements, contracts, and artist-facing schedules keep show details from scattering.",
    eyebrow: "Advancing",
    items: ["Show checklists", "Contract status", "Artist mobile view"],
    title: "Every show advances cleanly, on your terms.",
  },
];

const stats = [
  ["24h", "Follow-up window"],
  ["1", "Booking workspace"],
  ["4", "Core workflows"],
] as const;

function BookmoAiMockRow({ detail, label, tone, value }: MockRow) {
  return (
    <div className="bookmoAiMockRow">
      <span className={`bookmoAiDot bookmoAiDot-${tone}`} />
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <em>{value}</em>
    </div>
  );
}

export function BookmoAiLandingPage() {
  return (
    <div className="bookmoAiPage">
      <header className="bookmoAiNav">
        <a className="bookmoAiBrand" href="/bookmoai">
          Bookmo
        </a>
        <nav aria-label="Bookmo AI page sections">
          <a href="#outcomes">Outcomes</a>
          <a href="#features">Features</a>
          <a href="#access">Access</a>
        </nav>
        <a className="bookmoAiNavCta" href="#access">
          Request access
        </a>
      </header>

      <main>
        <section className="bookmoAiHero">
          <div className="bookmoAiHeroCopy">
            <p className="bookmoAiKicker">Early access · Spring 2026 cohort</p>
            <h1>
              Close more bookings, <span>with less chaos.</span>
            </h1>
            <p>
              Bookmo keeps deals moving while booking agencies focus on their
              artists, not their inbox. CRM, contracts, advancing, and
              follow-up in one music-industry workspace.
            </p>
            <div className="bookmoAiActions">
              <a href="#access">Request access</a>
              <a href="/">Back to dashboard</a>
            </div>
          </div>

          <aside className="bookmoAiMockup" aria-label="Bookmo AI workspace preview">
            <div className="bookmoAiMockHeader">
              <div>
                <span>Booking workspace</span>
                <strong>Agency control room</strong>
              </div>
              <small>Live context</small>
            </div>
            <div className="bookmoAiMockRows">
              {heroRows.map((row) => (
                <BookmoAiMockRow key={row.label} {...row} />
              ))}
            </div>
            <div className="bookmoAiMockFooter">
              <span>Assistant sent 4 follow-ups</span>
            </div>
          </aside>
        </section>

        <section className="bookmoAiStats" aria-label="Bookmo stats" id="outcomes">
          {stats.map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </section>

        <section className="bookmoAiIntro">
          <p className="bookmoAiKicker">Introducing Bookmo</p>
          <h2>
            The first smart CRM <span>for the music industry.</span>
          </h2>
          <p>
            Purpose-built for booking agencies: every artist, deal, contract,
            venue, and show detail in one place, with AI that handles the work
            around every booking.
          </p>
        </section>

        <section className="bookmoAiSections" id="features">
          {contentSections.map((section, index) => (
            <article className="bookmoAiFeature" key={section.title}>
              <div className="bookmoAiFeatureIndex">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <p className="bookmoAiKicker">{section.eyebrow}</p>
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
              </div>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="bookmoAiCta" id="access">
          <p className="bookmoAiKicker">Bookmo for agencies</p>
          <h2>Ready to bring order to your agency?</h2>
          <p>
            Request early access for the booking CRM built around how agencies
            already work: offers, inboxes, contracts, advancing, and artist
            logistics.
          </p>
          <a href="mailto:hello@bookmo.ai">Request access</a>
        </section>
      </main>
    </div>
  );
}
