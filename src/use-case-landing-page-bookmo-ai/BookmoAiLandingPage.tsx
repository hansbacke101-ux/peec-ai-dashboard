import { useEffect, useState, type ReactNode } from "react";
import "./bookmo-ai-landing.css";

type IconProps = {
  className?: string;
};

const navLinks = [
  { href: "#why-bookmo", label: "Why Bookmo" },
  { href: "#comparison", label: "Compare" },
  { href: "#migration", label: "Switch" },
  { href: "#faq", label: "FAQ" },
];

const featureCards = [
  {
    eyebrow: "CRM",
    icon: UsersIcon,
    title: "Keep buyers, venues, artists, and deal context together.",
    copy:
      "Bookmo gives booking teams a shared workspace for the relationships and moving parts behind every show, so context does not reset every season.",
  },
  {
    eyebrow: "Contracts",
    icon: SignatureIcon,
    title: "Move from agreement to signed booking with less admin.",
    copy:
      "Track booking admin around deals, contracts, documents, and follow-up from the same system your team uses to manage the opportunity.",
  },
  {
    eyebrow: "Advancing",
    icon: PinIcon,
    title: "Coordinate artist logistics before the show day panic.",
    copy:
      "Use booking-specific workflows for advancing, schedules, travel details, contacts, and artist-facing information instead of generic CRM fields.",
  },
  {
    eyebrow: "Follow-up",
    icon: MailCheckIcon,
    title: "Stay on top of inbox-driven booking work.",
    copy:
      "Bookmo is built around the reality that booking work often starts and continues in email, with follow-up and reminders tied back to real deals.",
  },
];

const controlRoomItems = [
  ["Offer follow-up", "Leipzig buyer needs a reply today", "#efc200"],
  ["Contract status", "Festival agreement ready for review", "#65d3ff"],
  ["Advancing", "Hotel and ground transport still open", "#ffb0cb"],
  ["Artist logistics", "Next 48 hours synced to artist view", "#bde9ff"],
] as const;

const comparisonRows = [
  [
    "Gigwell",
    "End-to-end booking management with EPKs, contacts, contracts, online payments, Tour IQ, ticket counts, and venue/talent-buyer workflows.",
    "Teams that want a broad live-event booking suite across artists, agencies, venues, and talent buyers.",
    "A full platform can be more than a boutique agency needs if the main gap is CRM discipline, follow-up, advancing, and internal booking workflow.",
  ],
  [
    "Generic CRM",
    "Flexible contact database, pipeline fields, notes, and reminders.",
    "Sales teams or agencies ready to customize their own booking system.",
    "Requires custom setup for shows, contracts, advancing, artist logistics, and booking-specific handoffs.",
  ],
  [
    "Spreadsheets",
    "Fast to start and easy for one person to edit.",
    "Very small teams with simple rosters and low booking volume.",
    "Hard to keep reliable once multiple agents, artists, offers, documents, and follow-ups are moving at once.",
  ],
  [
    "Bookmo",
    "Booking-focused CRM and AI-assisted workflow platform for deal follow-up, contracts, advancing, artist ops, and agency coordination.",
    "Music booking agencies that want operational clarity without building a custom system from generic tools.",
    "Best fit when your agency wants a focused operating layer rather than a broad venue database or ticket-count product.",
  ],
] as const;

const gigwellSignals = [
  "Gigwell positions itself as an end-to-end booking management platform for artists, agents, venues, and talent buyers.",
  "Its public product pages emphasize EPKs, centralized contacts, contracts with e-signatures, online payments, Tour IQ venue intelligence, ticket counts, and revenue tracking.",
  "That breadth is useful for teams that want a large booking suite, but it can be heavier than the operational CRM layer some agencies are looking for.",
] as const;

const alternativeReasons = [
  [
    "Focused booking CRM",
    "Bookmo concentrates on the agency workspace: opportunities, buyers, artists, internal ownership, next steps, contract status, and advancing context.",
  ],
  [
    "Built for follow-up discipline",
    "Booking teams live in moving conversations. Bookmo is shaped around next actions, reminders, and deal context instead of treating booking like a generic sales pipeline.",
  ],
  [
    "Artist operations in the workflow",
    "Advancing, schedules, travel context, contacts, and artist-facing details sit close to the booking record so handoffs are easier to trust.",
  ],
  [
    "AI-assisted agency work",
    "Bookmo is designed as a modern workflow layer for agencies that want help summarizing context, spotting next steps, and operating with less spreadsheet cleanup.",
  ],
] as const;

const migrationSteps = [
  [
    "Map the current booking workflow",
    "List the places your team tracks buyers, artists, offers, contracts, advancing, documents, and follow-up today.",
  ],
  [
    "Import and structure core relationships",
    "Bring the buyer, venue, artist, and contact context into one workspace so agents can see the full booking history.",
  ],
  [
    "Rebuild follow-up and advancing routines",
    "Turn recurring booking admin into clear next actions tied to the deal or show instead of relying on memory and inbox search.",
  ],
  [
    "Evaluate Bookmo against real bookings",
    "Use active opportunities to compare whether the workflow feels clearer than your Gigwell, spreadsheet, or generic CRM setup.",
  ],
] as const;

const workspaceCards = [
  [
    "Deal flow",
    "Track opportunities, buyer context, next steps, and internal ownership while your team moves from first conversation to confirmed booking.",
  ],
  [
    "Contract admin",
    "Keep booking documents and contract status close to the deal so handoffs stay visible.",
  ],
  [
    "Artist operations",
    "Coordinate advancing, schedules, travel context, contacts, and artist-facing details around each show.",
  ],
] as const;

const faqItems = [
  {
    question: "Is Bookmo a Gigwell alternative?",
    answer:
      "Bookmo can be evaluated as a Gigwell alternative for music booking agencies that mainly need a focused CRM and workflow layer for deal follow-up, contracts, advancing, and artist operations. Gigwell is broader and includes products such as EPKs, online payments, venue intelligence, ticket counts, and talent-buyer workflows.",
  },
  {
    question: "What is the main difference between Bookmo and Gigwell?",
    answer:
      "Gigwell publicly positions itself as an end-to-end booking management platform across artists, agents, venues, and talent buyers. Bookmo is positioned as a focused CRM and AI-powered workflow platform for booking agencies that want clearer day-to-day operating context.",
  },
  {
    question: "What is a music booking agency CRM?",
    answer:
      "A music booking agency CRM is a system for managing the relationships, deals, shows, contracts, tasks, and follow-up that booking agents handle for artists and venues.",
  },
  {
    question: "Why do booking agencies need software beyond a generic CRM?",
    answer:
      "Booking agencies do more than store contacts. They coordinate artist availability, offers, show details, contracts, advancing, travel context, and buyer follow-up across many moving conversations.",
  },
  {
    question: "Can Bookmo help with advancing and artist logistics?",
    answer:
      "Bookmo is designed for booking-agency workflows including artist logistics, advancing, event details, contacts, schedule context, and artist-facing operational information.",
  },
];

function ArrowIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M5 12h13m-5-5 5 5-5 5" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function ClipboardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M9 5h6" />
      <path d="M9 3h6v4H9z" />
      <path d="M6 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" />
      <path d="M8 12h8M8 16h6" />
    </svg>
  );
}

function MailCheckIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M4 7h16v10H4z" />
      <path d="m4 8 8 6 8-6" />
      <path d="m15 19 2 2 4-5" />
    </svg>
  );
}

function PinIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SignatureIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M14 3h5v5" />
      <path d="m10 13 9-9" />
      <path d="M5 19c2.5-5 4.5-5 6 0 1-3 2.2-3.8 4-1.5 1.1 1.4 2.4 1.8 4 1.5" />
    </svg>
  );
}

function SparkIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="m12 3 1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path d="M16 19c0-2.2-1.8-4-4-4H7c-2.2 0-4 1.8-4 4" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M21 19c0-2.2-1.8-4-4-4h-.5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    </svg>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="bookmoKicker">{children}</p>;
}

function SectionHeading({
  copy,
  kicker,
  title,
}: {
  copy: ReactNode;
  kicker: string;
  title: ReactNode;
}) {
  return (
    <div className="bookmoSectionHeading">
      <Kicker>{kicker}</Kicker>
      <h2>{title}</h2>
      <div>{copy}</div>
    </div>
  );
}

function PublicShell({
  children,
  onSignup,
}: {
  children: ReactNode;
  onSignup: () => void;
}) {
  return (
    <div className="bookmoPublic">
      <div aria-hidden="true" className="bookmoPageAura" />
      <header className="bookmoNav">
        <div className="bookmoNavInner">
          <div className="bookmoNavLeft">
            <a className="bookmoBrand" href="/alternatives/gigwell">
              Bookmo
            </a>
            <nav aria-label="Bookmo page sections">
              {navLinks.map((link) => (
                <a href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="bookmoNavRight">
            <a href="/login">Login</a>
            <button onClick={onSignup} type="button">
              Request access
              <ArrowIcon />
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bookmoFooter">
        <div className="bookmoFooterInner">
          <div>
            <a className="bookmoBrand" href="/alternatives/gigwell">
              Bookmo
            </a>
            <p>
              CRM and workflow software for music booking agencies, artists,
              and the operating work around every show.
            </p>
          </div>
          <nav aria-label="Bookmo footer links">
            <a href="/bookmo-ai">Bookmo home</a>
            <a href="/login">Login</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function RequestAccessDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="bookmoDialogBackdrop" role="presentation">
      <section aria-label="Request access" className="bookmoDialog">
        <button
          aria-label="Close request access dialog"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
        <Kicker>Agency signup</Kicker>
        <h2>Request access to Bookmo</h2>
        <p>
          Tell us what you use today and we will help you evaluate whether
          Bookmo is a better fit for your booking workflow.
        </p>
        <a href="mailto:hello@bookmo.ai">hello@bookmo.ai</a>
      </section>
    </div>
  );
}

export function BookmoAiLandingPage() {
  const [signupOpen, setSignupOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <PublicShell onSignup={() => setSignupOpen(true)}>
      <section className="bookmoHero">
        <div aria-hidden="true" className="bookmoHeroAura" />
        <div className="bookmoHeroGrid">
          <div className="bookmoHeroCopy">
            <div className="bookmoHeroBadge">
              <span />
              Gigwell alternative for music booking agencies
            </div>
            <h1>
              A focused Gigwell alternative for booking agency CRM and artist
              operations.
            </h1>
            <p>
              Bookmo is a CRM and AI-powered workflow platform for music
              booking agencies that want clearer deal follow-up, contracts,
              advancing, artist logistics, and booking operations without
              stitching together spreadsheets or over-customized generic tools.
            </p>
            <div className="bookmoHeroActions">
              <button onClick={() => setSignupOpen(true)} type="button">
                Request access
                <ArrowIcon />
              </button>
              <a href="#comparison">
                Compare with Gigwell
                <ArrowIcon />
              </a>
            </div>
          </div>

          <aside
            aria-label="Bookmo agency control room preview"
            className="bookmoControlRoom"
          >
            <div className="bookmoControlHeader">
              <div>
                <p>Booking workspace</p>
                <h2>Agency control room</h2>
              </div>
              <span>Live context</span>
            </div>
            <div className="bookmoControlRows">
              {controlRoomItems.map(([title, detail, color]) => (
                <article key={title}>
                  <i style={{ backgroundColor: color }} />
                  <div>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                  </div>
                  <CheckIcon />
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="bookmoSection bookmoTinted" id="why-bookmo">
        <div className="bookmoContainer">
          <SectionHeading
            kicker="Why teams look for Gigwell alternatives"
            title={
              <>
                Booking work is not just{" "}
                <span className="bookmoGradientText">end-to-end software.</span>
              </>
            }
            copy="A broad booking suite can be valuable, but many agencies are trying to solve a narrower operating problem: keeping deal context, buyer relationships, contracts, advancing, and next steps reliable across a fast-moving roster."
          />
          <div className="bookmoSignalCard">
            <Kicker>What Gigwell is known for</Kicker>
            <ul>
              {gigwellSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
          <div className="bookmoFeatureCards">
            {featureCards.map(({ copy, eyebrow, icon: Icon, title }) => (
              <article key={title}>
                <div className="bookmoIconBox">
                  <Icon />
                </div>
                <p>{eyebrow}</p>
                <h3>{title}</h3>
                <span>{copy}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bookmoSection" id="comparison">
        <div className="bookmoCompareGrid">
          <div className="bookmoCompareCopy">
            <Kicker>Gigwell vs Bookmo</Kicker>
            <h2>Choose the workflow depth your agency actually needs.</h2>
            <p>
              Gigwell is a broad booking management platform. Bookmo is for
              booking agencies that want a focused CRM and operational layer for
              relationships, follow-up, contracts, advancing, and artist ops.
              The right choice depends on whether you need a wide booking suite
              or a simpler agency control room.
            </p>
          </div>
          <div className="bookmoCompareTable bookmoCompareTableWide">
            <div className="bookmoCompareHead">
              <span>Option</span>
              <span>Core strength</span>
              <span>Best fit</span>
              <span>Tradeoff</span>
            </div>
            {comparisonRows.map(([option, strength, bestFit, tradeoff]) => (
              <div className="bookmoCompareRow" key={option}>
                <strong>{option}</strong>
                <span>{strength}</span>
                <span>{bestFit}</span>
                <span>{tradeoff}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bookmoSection bookmoTinted">
        <div className="bookmoContainer">
          <SectionHeading
            kicker="Why Bookmo instead"
            title={
              <>
                A leaner operating layer for{" "}
                <span className="bookmoGradientText">booking teams.</span>
              </>
            }
            copy="Bookmo is not trying to be every live-event tool at once. It is designed to make the agency workflow easier to see, trust, and act on every day."
          />
          <div className="bookmoReasonGrid">
            {alternativeReasons.map(([title, copy]) => (
              <article key={title}>
                <CheckIcon />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bookmoSection" id="migration">
        <div className="bookmoContainer">
          <SectionHeading
            kicker="Switching from Gigwell or spreadsheets"
            title={
              <>
                Evaluate Bookmo with your{" "}
                <span className="bookmoGradientText">real booking data.</span>
              </>
            }
            copy="A strong migration does not start with a software checklist. It starts by making the current booking workflow visible, then moving the highest-friction routines into a system your team can actually maintain."
          />
          <div className="bookmoMigrationTimeline">
            {migrationSteps.map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bookmoSection bookmoTinted">
        <div className="bookmoContainer">
          <SectionHeading
            kicker="What Bookmo helps manage"
            title={
              <>
                One workspace for the jobs around{" "}
                <span className="bookmoGradientText">every booking.</span>
              </>
            }
            copy="Bookmo combines CRM structure with booking-specific workflow support, so the team can see what needs attention before a deal or show slips."
          />
          <div className="bookmoWorkspaceCards">
            {workspaceCards.map(([title, copy]) => (
              <article key={title}>
                <ClipboardIcon />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bookmoSection" id="faq">
        <div className="bookmoFaqContainer">
          <SectionHeading
            kicker="FAQ"
            title="Gigwell alternative questions"
            copy="Short answers for agency teams comparing Gigwell, spreadsheets, generic CRMs, and a purpose-built booking workflow platform."
          />
          <div className="bookmoFaqList">
            {faqItems.map(({ answer, question }) => (
              <article key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bookmoFinalCta" id="cta">
        <div aria-hidden="true" className="bookmoCtaAura" />
        <SparkIcon />
        <h2>Ready to compare Bookmo with your current booking stack?</h2>
        <p>
          Request access and we will help you evaluate Bookmo against Gigwell,
          spreadsheets, or the CRM setup your agency uses today.
        </p>
        <div>
          <button onClick={() => setSignupOpen(true)} type="button">
            Request access
            <ArrowIcon />
          </button>
          <a href="/bookmo-ai">Back to Bookmo home</a>
        </div>
      </section>

      {signupOpen ? (
        <RequestAccessDialog onClose={() => setSignupOpen(false)} />
      ) : null}
    </PublicShell>
  );
}
