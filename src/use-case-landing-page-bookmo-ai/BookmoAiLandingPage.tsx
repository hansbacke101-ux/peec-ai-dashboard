import { useEffect, useState, type ReactNode } from "react";
import "./bookmo-ai-landing.css";

type QueueItem = {
  color: string;
  note: string;
  status: string;
  title: string;
};

type FeatureStripProps = {
  badge?: string;
  children: ReactNode;
  copy: ReactNode;
  headline: string;
  label: string;
  reverse?: boolean;
  tinted?: boolean;
};

const queueItems: QueueItem[] = [
  {
    color: "#efc200",
    note: "Expires in 4h",
    status: "Urgent",
    title: "North Hall offer",
  },
  {
    color: "#ffb0cb",
    note: "Artist approval",
    status: "Action",
    title: "Leipzig routing",
  },
  {
    color: "#65d3ff",
    note: "7d overdue",
    status: "Overdue",
    title: "Venue invoice",
  },
  {
    color: "#9a9ca7",
    note: "Signed",
    status: "Done",
    title: "Hamburg contract",
  },
];

const partnerLogos = [
  "Berlin Senate",
  "European Union",
  "Avant Now",
  "VDH",
  "Selective Artists",
  "Laut & Luise",
];

const outcomes = [
  {
    body:
      "Automations send follow-ups from your own inbox, surface the next action, and keep opportunities warm without constant chasing.",
    color: "#efc200",
    label: "Automations keep deals moving.",
    num: "01",
    voice: "Why haven't they replied yet?",
  },
  {
    body:
      "Bookmo becomes the operating layer that ties inbox, CRM, contracts, advancing, and artist information together.",
    color: "#65d3ff",
    label: "Integrations keep everything connected.",
    num: "02",
    voice: "The details are scattered across five tools.",
  },
  {
    body:
      "AI agents handle the surrounding work around every deal so the team can spend more time on artists and buyers.",
    color: "#ffb0cb",
    label: "AI agents lighten the day-to-day.",
    num: "03",
    voice: "Half my day disappears before the real work starts.",
  },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m12 3 1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16v10H4z" />
      <path d="m4 8 8 6 8-6" />
    </svg>
  );
}

function FeatureStrip({
  badge,
  children,
  copy,
  headline,
  label,
  reverse = false,
  tinted = false,
}: FeatureStripProps) {
  return (
    <section className={`bookmoFeatureStrip ${tinted ? "isTinted" : ""}`}>
      <div className={`bookmoFeatureGrid ${reverse ? "isReverse" : ""}`}>
        <div className="bookmoFeatureCopy">
          <p className="bookmoKicker">{label}</p>
          <div className="bookmoFeatureHeading">
            <h2>{headline}</h2>
            {badge ? <span>{badge}</span> : null}
          </div>
          <p>{copy}</p>
        </div>
        <div className="bookmoFeatureMock">{children}</div>
      </div>
    </section>
  );
}

function PriorityQueueMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bookmoQueueMock ${compact ? "isCompact" : ""}`}>
      <div className="bookmoMockToolbar">
        <div>
          <strong>Priority queue</strong>
          <span>Today</span>
        </div>
        <small>Search</small>
      </div>
      <div className="bookmoQueueHead">
        <span>Task</span>
        <span>Due</span>
        <span>Status</span>
      </div>
      <div className="bookmoQueueRows">
        {queueItems.map((item) => (
          <div className="bookmoQueueRow" key={item.title}>
            <div>
              <i style={{ backgroundColor: item.color }} />
              <strong>{item.title}</strong>
            </div>
            <span>{item.note}</span>
            <em
              style={{
                backgroundColor: `${item.color}12`,
                borderColor: `${item.color}40`,
                color: item.color,
              }}
            >
              {item.status}
            </em>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicShell({ children }: { children: ReactNode }) {
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <div className="bookmoPublic">
      <header className="bookmoNav">
        <a className="bookmoBrand" href="/bookmo-ai">
          Bookmo
        </a>
        <nav aria-label="Bookmo sections">
          <a href="#outcomes">Outcomes</a>
          <a href="#features">Features</a>
          <a href="#cta">Access</a>
        </nav>
        <button onClick={() => setSignupOpen(true)} type="button">
          Request access
        </button>
      </header>
      {children}
      <footer className="bookmoFooter">
        <div>
          <p className="bookmoKicker">Bookmo for agencies</p>
          <h2>Ready to upgrade your agency?</h2>
          <button onClick={() => setSignupOpen(true)} type="button">
            Request access
            <ArrowIcon />
          </button>
        </div>
        <p>Bookmo · CRM for music booking agencies</p>
      </footer>
      {signupOpen ? (
        <div className="bookmoDialogBackdrop" role="presentation">
          <section aria-label="Request access" className="bookmoDialog">
            <button
              aria-label="Close request access dialog"
              onClick={() => setSignupOpen(false)}
              type="button"
            >
              Close
            </button>
            <p className="bookmoKicker">Agency signup</p>
            <h2>Request access to Bookmo</h2>
            <p>
              This local copy keeps the signup as a simple placeholder. The
              real CRM project connects this moment to its waitlist flow.
            </p>
            <a href="mailto:hello@bookmo.ai">hello@bookmo.ai</a>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function BookmoAiLandingPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <PublicShell>
      <main>
        <section className="bookmoHero">
          <div className="bookmoAmbient" aria-hidden="true" />
          <div className="bookmoHeroInner">
            <div className="bookmoHeroCopy">
              <div className="bookmoHeroBadge">
                <span />
                Early access · Spring 2026 cohort
              </div>
              <h1>
                Close more bookings,
                <br />
                <span>with less chaos.</span>
              </h1>
              <p>
                Bookmo keeps deals moving while you focus on your artists, not
                your inbox.
              </p>
              <div className="bookmoHeroActions">
                <a href="#cta">
                  Request access
                  <ArrowIcon />
                </a>
                <span>
                  <CheckIcon />
                  Limited spots · Onboarding included
                </span>
              </div>
            </div>

            <div className="bookmoHeroStack" aria-label="Bookmo workspace preview">
              <div className="bookmoSparkChip">
                <SparkIcon />
                Assistant sent 4 follow-ups
              </div>
              <PriorityQueueMock compact />
              <div className="bookmoEmailToast">
                <div>
                  <b>MR</b>
                  <strong>Marco replied</strong>
                  <span>just now</span>
                </div>
                <p>
                  "Works for us. Send the contract and we'll get it signed
                  today."
                </p>
                <small>
                  <MailIcon />
                  Re: Leipzig offer
                </small>
              </div>
              <div className="bookmoSignedPill">
                <CheckIcon />
                <div>
                  <strong>Contract signed</strong>
                  <span>Conne Island · Apr 09</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bookmoLogoStrip" aria-label="Supported by">
          <p>Supported by</p>
          <div>
            {[...partnerLogos, ...partnerLogos].map((logo, index) => (
              <span key={`${logo}-${index}`}>{logo}</span>
            ))}
          </div>
        </section>

        <section className="bookmoIntro">
          <p className="bookmoKicker">Introducing Bookmo</p>
          <h2>
            The first smart CRM
            <br />
            <span>for the music industry.</span>
          </h2>
          <p>
            Purpose-built for booking agencies: every artist, deal, contract,
            and venue in one place, with AI that handles the work around every
            show.
          </p>
        </section>

        <section className="bookmoOutcomes" id="outcomes">
          {outcomes.map((outcome) => (
            <article key={outcome.num} style={{ "--accent": outcome.color }}>
              <span>{outcome.num} / 03</span>
              <p>{outcome.voice}</p>
              <h2>{outcome.label}</h2>
              <p>{outcome.body}</p>
            </article>
          ))}
        </section>

        <div id="features" className="bookmoFeatures">
          <FeatureStrip
            label="Agency Dashboard"
            headline="Know what needs action before your day starts."
            copy="Every artist, deal, and deadline in one live view. No digging through emails to find what is about to fall through."
          >
            <PriorityQueueMock />
          </FeatureStrip>

          <FeatureStrip
            label="Inbox-Native Reminders"
            headline="More deals closed. Less time in your inbox."
            copy={
              <>
                Buyers are more likely to reply when follow-ups go out quickly.
                Bookmo sends them automatically from your own address.
              </>
            }
            reverse
            tinted
          >
            <div className="bookmoMailMock">
              <div className="bookmoMockToolbar">
                <div>
                  <MailIcon />
                  <strong>Sent</strong>
                </div>
                <span>Auto follow-up</span>
              </div>
              <article>
                <div>
                  <b>NR</b>
                  <div>
                    <strong>Nina Rosen</strong>
                    <span>nina@agency.com → marco@northhall.de</span>
                  </div>
                  <small>2h ago</small>
                </div>
                <h3>Re: Leipzig offer — still interested?</h3>
                <p>
                  Hi Marco, just following up on the offer we sent Tuesday.
                  Happy to hop on a quick call if that helps.
                </p>
              </article>
              <footer>
                <CheckIcon />
                Buyer replied 6 hours later
              </footer>
            </div>
          </FeatureStrip>

          <FeatureStrip
            label="Advancing"
            headline="Every show advances cleanly, on your terms."
            copy="Custom fields, templates, and tasklists built for real riders, not generic checklists."
          >
            <div className="bookmoAdvancingMock">
              <header>
                <b>PA</b>
                <div>
                  <strong>Pano · Festsaal Kreuzberg</strong>
                  <span>Berlin · Apr 08 · 650 cap</span>
                </div>
                <small>2 / 4 done</small>
              </header>
              <div className="bookmoProgress">
                <span />
              </div>
              <nav>
                <span>Production</span>
                <span>Travel</span>
                <span>Hospitality</span>
                <span>Settlement</span>
              </nav>
              {[
                ["Stage plot uploaded", true, "Tour manager · 2d ago"],
                ["Hospitality rider confirmed", true, "Venue · yesterday"],
                ["Hotel accommodation", false, "Owed by venue"],
                ["Ground transport locked", false, "Owed by tour manager"],
              ].map(([label, done, owner]) => (
                <div className="bookmoChecklistRow" key={String(label)}>
                  <i className={done ? "isDone" : ""}>{done ? <CheckIcon /> : null}</i>
                  <strong>{label}</strong>
                  <span>{owner}</span>
                </div>
              ))}
            </div>
          </FeatureStrip>

          <FeatureStrip
            label="Artist Mobile App"
            headline="Artists who never have to ask twice."
            copy="Schedule, travel, and contacts on their phone, updated automatically."
            reverse
            tinted
          >
            <div className="bookmoPhoneMock">
              <div>
                <span>9:41</span>
                <i />
              </div>
              <section>
                <header>
                  <b>PA</b>
                  <div>
                    <span>Upcoming · Pano</span>
                    <strong>Next 48 hours</strong>
                  </div>
                </header>
                {[
                  ["Tonight", "Festsaal Kreuzberg", "22:00", "Berlin · DE"],
                  ["Tomorrow", "Train DE → NL", "11:30", "Berlin Hbf"],
                  ["Apr 13", "Skatecafe Amsterdam", "23:30", "Amsterdam · NL"],
                ].map(([date, venue, time, sub]) => (
                  <article key={date}>
                    <div>
                      <span>{date}</span>
                      <strong>{time}</strong>
                    </div>
                    <h3>{venue}</h3>
                    <p>{sub}</p>
                  </article>
                ))}
              </section>
            </div>
          </FeatureStrip>

          <FeatureStrip
            label="Smart Agents"
            headline="AI agents for the work around every deal."
            copy="Bookmo handles the surrounding work so the people on your roster get more attention."
            badge="Coming soon"
          >
            <div className="bookmoAgentMock">
              <header>
                <SparkIcon />
                <div>
                  <strong>Assistant</strong>
                  <span>2 suggestions · just now</span>
                </div>
                <small>Live</small>
              </header>
              <article>
                <SparkIcon />
                <p>
                  Leipzig buyer has not replied in 48h. Want me to send a
                  follow-up from your inbox?
                </p>
                <div>
                  <button type="button">Send follow-up</button>
                  <button type="button">Remind later</button>
                </div>
              </article>
            </div>
          </FeatureStrip>
        </div>

        <section className="bookmoFinalCta" id="cta">
          <p className="bookmoKicker">Bookmo for agencies</p>
          <h2>
            Ready to upgrade
            <br />
            <span>your agency?</span>
          </h2>
          <p>
            The agencies moving fastest are not working harder. They are
            working in Bookmo.
          </p>
          <a href="mailto:hello@bookmo.ai">
            Request access
            <ArrowIcon />
          </a>
        </section>
      </main>
    </PublicShell>
  );
}
