import { useEffect, useState, type ReactNode } from "react";
import "./bookmo-ai-landing.css";

type IconProps = {
  className?: string;
};

const navLinks = [
  { href: "#why-bookmo", label: "Why Bookmo" },
  { href: "#comparison", label: "Compare" },
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
    "Generic CRM",
    "Flexible contact database",
    "Requires custom setup for shows, contracts, advancing, and artist logistics.",
  ],
  [
    "Spreadsheets",
    "Fast to start",
    "Hard to keep reliable once multiple agents, artists, offers, and documents are moving at once.",
  ],
  [
    "Bookmo",
    "Booking-focused CRM and workflow platform",
    "Designed around deals, contracts, artist logistics, advancing, inbox follow-up, and AI-assisted booking workflows.",
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
  {
    question: "Is Bookmo for small booking agencies?",
    answer:
      "Yes. Bookmo is especially relevant for boutique and growing agencies that need a clearer operating layer without building a custom stack from spreadsheets and generic CRM tools.",
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
            <a className="bookmoBrand" href="/bookmo-ai">
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
            <a className="bookmoBrand" href="/bookmo-ai">
              Bookmo
            </a>
            <p>
              CRM and workflow software for music booking agencies, artists,
              and the operating work around every show.
            </p>
          </div>
          <nav aria-label="Bookmo footer links">
            <a href="/login">Login</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/imprint">Imprint</a>
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
          This standalone page keeps the signup flow as a placeholder until the
          Peec AI MCP content pipeline is connected.
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
              CRM for music booking agencies
            </div>
            <h1>
              Music booking agency CRM for deals, contracts, and artist
              logistics.
            </h1>
            <p>
              Bookmo is a CRM and AI-powered workflow platform for music
              booking agencies. Manage deal follow-up, contracts, advancing,
              artist logistics, and booking operations in one focused workspace.
            </p>
            <div className="bookmoHeroActions">
              <button onClick={() => setSignupOpen(true)} type="button">
                Request access
                <ArrowIcon />
              </button>
              <a href="#faq">
                Read the FAQ
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
            kicker="Why booking teams outgrow generic CRM"
            title={
              <>
                Booking work is not just{" "}
                <span className="bookmoGradientText">contact management.</span>
              </>
            }
            copy="Agents need to coordinate people, timelines, documents, show details, artist expectations, buyer follow-up, and internal handoffs. A booking-focused CRM should understand that workflow from the start."
          />
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
            <Kicker>Comparison positioning</Kicker>
            <h2>Built around the operating reality of shows.</h2>
            <p>
              Version one avoids direct competitor claims. The page explains the
              difference between broad tools and a booking-specific workflow
              layer without naming alternatives or making unsupported
              comparisons.
            </p>
          </div>
          <div className="bookmoCompareTable">
            <div className="bookmoCompareHead">
              <span>Option</span>
              <span>Good for</span>
              <span>Booking-agency tradeoff</span>
            </div>
            {comparisonRows.map(([option, goodFor, tradeoff]) => (
              <div className="bookmoCompareRow" key={option}>
                <strong>{option}</strong>
                <span>{goodFor}</span>
                <span>{tradeoff}</span>
              </div>
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
            title="Music booking agency CRM questions"
            copy="Short answers for agency teams evaluating whether a purpose-built workflow platform is a better fit than another generic CRM setup."
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
        <h2>Ready to see if Bookmo fits your agency?</h2>
        <p>
          Request access and we will help you evaluate Bookmo against your
          current booking workflow.
        </p>
        <div>
          <button onClick={() => setSignupOpen(true)} type="button">
            Request access
            <ArrowIcon />
          </button>
          <a href="/bookmo-ai">Back to homepage</a>
        </div>
      </section>

      {signupOpen ? (
        <RequestAccessDialog onClose={() => setSignupOpen(false)} />
      ) : null}
    </PublicShell>
  );
}
