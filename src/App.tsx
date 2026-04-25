import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useCopilotAdditionalInstructions,
  useCopilotReadable,
  useFrontendTool,
} from "@copilotkit/react-core";
import Chatbot from "./Chatbot";

type Project = {
  id: string;
  name: string;
  status: string;
};

type ProjectsResponse = {
  columns?: string[];
  data?: Project[];
  rows?: unknown[][];
};

type BrandReportRow = {
  brandId: string;
  brandName: string;
  visibility: number | null;
  shareOfVoice: number | null;
  sentiment: number | null;
  position: number | null;
};

type ReportResponse = {
  columns?: string[];
  data?: Record<string, unknown>[];
  rows?: unknown[][];
};

type ChartMetric = keyof Pick<
  BrandReportRow,
  "position" | "sentiment" | "shareOfVoice" | "visibility"
>;

type MetricConfig = {
  description: string;
  key: ChartMetric;
  label: string;
  tone: string;
};

type DashboardViewMode = "company" | "comparison" | "metricFocus" | "overview";

type SortDirection = "asc" | "desc";

type CompanySort = {
  direction: SortDirection;
  metric: ChartMetric;
};

type ScrollTarget = "companyNav" | "mainView" | "projectCard";

const metricConfigs: MetricConfig[] = [
  {
    description: "How often this brand is surfaced in AI answers.",
    key: "visibility",
    label: "Visibility",
    tone: "violet",
  },
  {
    description: "Relative presence against the rest of the market.",
    key: "shareOfVoice",
    label: "Share of voice",
    tone: "blue",
  },
  {
    description: "The tone AI systems use when describing the brand.",
    key: "sentiment",
    label: "Sentiment",
    tone: "green",
  },
  {
    description: "Average answer placement. Lower rank is stronger.",
    key: "position",
    label: "Position",
    tone: "orange",
  },
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return formatDate(date);
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const text = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson && text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  if (!data) {
    throw new Error("The API returned a non-JSON response.");
  }

  return data;
}

function readCell<T>(
  columns: string[],
  row: unknown[],
  key: string,
): T | null {
  const index = columns.indexOf(key);
  return index === -1 ? null : (row[index] as T);
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function readBrand(row: Record<string, unknown>) {
  if (!row.brand || typeof row.brand !== "object") {
    return null;
  }

  return row.brand as Record<string, unknown>;
}

function normalizeProjects(response: ProjectsResponse): Project[] {
  if (response.data) {
    return response.data;
  }

  const columns = response.columns ?? [];
  const rows = response.rows ?? [];

  return rows.map((row) => ({
    id: String(readCell(columns, row, "id") ?? ""),
    name: String(readCell(columns, row, "name") ?? "Untitled"),
    status: String(readCell(columns, row, "status") ?? "unknown"),
  }));
}

function normalizeReport(response: ReportResponse): BrandReportRow[] {
  if (response.data) {
    return response.data.map((row) => ({
      brandId: String(readBrand(row)?.id ?? row.brand_id ?? ""),
      brandName: String(
        readBrand(row)?.name ?? row.brand_name ?? row.brandName ?? "Unknown",
      ),
      visibility: readNumber(row.visibility),
      shareOfVoice: readNumber(row.share_of_voice),
      sentiment: readNumber(row.sentiment),
      position: readNumber(row.position),
    }));
  }

  const columns = response.columns ?? [];
  const rows = response.rows ?? [];

  return rows.map((row) => ({
    brandId: String(readCell(columns, row, "brand_id") ?? ""),
    brandName: String(readCell(columns, row, "brand_name") ?? "Unknown"),
    visibility: readCell<number>(columns, row, "visibility"),
    shareOfVoice: readCell<number>(columns, row, "share_of_voice"),
    sentiment: readCell<number>(columns, row, "sentiment"),
    position: readCell<number>(columns, row, "position"),
  }));
}

function percent(value: number | null) {
  return value === null ? "n/a" : `${Math.round(value * 100)}%`;
}

function numberValue(value: number | null) {
  return value === null ? "n/a" : value.toFixed(1);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function brandKey(brand: BrandReportRow) {
  return brand.brandId || brand.brandName;
}

function getMetricValue(brand: BrandReportRow, key: ChartMetric) {
  return brand[key];
}

function formatMetric(value: number | null, key: ChartMetric) {
  return key === "visibility" || key === "shareOfVoice"
    ? percent(value)
    : numberValue(value);
}

function average(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null);

  if (!numbers.length) {
    return null;
  }

  const total = numbers.reduce((sum, value) => sum + value, 0);
  return total / numbers.length;
}

function compareMetric(
  left: BrandReportRow,
  right: BrandReportRow,
  key: ChartMetric,
) {
  const leftValue = getMetricValue(left, key);
  const rightValue = getMetricValue(right, key);

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  return key === "position"
    ? leftValue - rightValue
    : rightValue - leftValue;
}

function getBarWidth(
  value: number | null,
  values: number[],
  key: ChartMetric,
) {
  if (value === null) {
    return 0;
  }

  if (key === "position") {
    const max = Math.max(...values);
    const min = Math.min(...values);

    if (max === min) {
      return 100;
    }

    return clamp(((max - value) / (max - min)) * 84 + 16);
  }

  return clamp(value * 100);
}

function barStyle(width: number): CSSProperties {
  return {
    "--bar-width": `${width}%`,
  } as CSSProperties;
}

function getTopBrand(report: BrandReportRow[], key: ChartMetric) {
  return [...report].sort((left, right) => compareMetric(left, right, key))[0];
}

function getMetricConfig(key: ChartMetric) {
  return metricConfigs.find((config) => config.key === key) ?? metricConfigs[0];
}

function isChartMetric(value: string): value is ChartMetric {
  return metricConfigs.some((config) => config.key === value);
}

function sortReport(
  report: BrandReportRow[],
  metric: ChartMetric,
  direction: SortDirection,
) {
  const sorted = [...report].sort((left, right) =>
    compareMetric(left, right, metric),
  );

  return direction === "asc" ? sorted.reverse() : sorted;
}

function buildInsights(brand: BrandReportRow) {
  const insights = [];

  if ((brand.visibility ?? 0) < 0.25) {
    insights.push("Visibility is still early. Prioritize answer inclusion.");
  } else {
    insights.push("Visibility is established enough to defend and expand.");
  }

  if ((brand.shareOfVoice ?? 0) < 0.2) {
    insights.push("Share of voice has room to grow against competitors.");
  } else {
    insights.push("Share of voice is a strength worth protecting.");
  }

  if (brand.position !== null && brand.position > 3) {
    insights.push("Average position suggests a ranking improvement chance.");
  } else {
    insights.push("Position looks competitive for high-intent prompts.");
  }

  return insights;
}

function StatTile({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <article className="statTile">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function ChartPanel({
  config,
  report,
  sortDirection = "desc",
}: {
  config: MetricConfig;
  report: BrandReportRow[];
  sortDirection?: SortDirection;
}) {
  const rows = sortReport(report, config.key, sortDirection);
  const values = rows
    .map((brand) => getMetricValue(brand, config.key))
    .filter((value): value is number => value !== null);

  return (
    <article className={`chartPanel tone-${config.tone}`}>
      <div className="chartHeader">
        <div>
          <h3>{config.label}</h3>
          <p>{config.description}</p>
        </div>
        <span>{rows.length} brands</span>
      </div>

      <div className="chartRows">
        {rows.map((brand) => {
          const value = getMetricValue(brand, config.key);
          const width = getBarWidth(value, values, config.key);

          return (
            <div className="chartRow" key={brandKey(brand)}>
              <div className="chartLabel">
                <span>{brand.brandName}</span>
                <strong>{formatMetric(value, config.key)}</strong>
              </div>
              <div className="barTrack">
                <div className="barFill" style={barStyle(width)} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function CompanyCard({
  brand,
  isActive,
  onSelect,
}: {
  brand: BrandReportRow;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`companyCard ${isActive ? "isActive" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span>{brand.brandName}</span>
      <strong>{percent(brand.visibility)}</strong>
      <small>
        {percent(brand.shareOfVoice)} SOV - position{" "}
        {numberValue(brand.position)}
      </small>
    </button>
  );
}

function CompanyPage({ brand }: { brand: BrandReportRow }) {
  const insights = buildInsights(brand);

  return (
    <section className="companyPage">
      <div className="companyHero">
        <div>
          <p className="eyebrow">Company page</p>
          <h2>{brand.brandName}</h2>
          <p>
            A focused view of the selected company across AI visibility,
            market presence, sentiment, and average answer position.
          </p>
        </div>
        <div className="heroScore">
          <span>Visibility</span>
          <strong>{percent(brand.visibility)}</strong>
        </div>
      </div>

      <div className="detailGrid">
        {metricConfigs.map((config) => {
          const value = getMetricValue(brand, config.key);
          const width = getBarWidth(value, [value ?? 0], config.key);

          return (
            <article className="detailMetric" key={config.key}>
              <span>{config.label}</span>
              <strong>{formatMetric(value, config.key)}</strong>
              <div className="barTrack">
                <div className="barFill" style={barStyle(width)} />
              </div>
              <p>{config.description}</p>
            </article>
          );
        })}
      </div>

      <div className="insightCard">
        <h3>Recommended focus</h3>
        <ul>
          {insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MetricFocusView({
  metric,
  report,
  sortDirection,
}: {
  metric: ChartMetric;
  report: BrandReportRow[];
  sortDirection: SortDirection;
}) {
  const config = getMetricConfig(metric);
  const rows = sortReport(report, metric, sortDirection);
  const leader = rows[0];
  const laggard = rows[rows.length - 1];

  return (
    <section className="card adaptivePanel">
      <div className="cardHeader">
        <div>
          <p className="eyebrow">Metric focus</p>
          <h2>{config.label}</h2>
          <p>{config.description}</p>
        </div>
      </div>

      <div className="focusGrid">
        <StatTile
          detail={leader?.brandName ?? "No brand data yet"}
          label="Strongest brand"
          value={formatMetric(
            leader ? getMetricValue(leader, metric) : null,
            metric,
          )}
        />
        <StatTile
          detail={laggard?.brandName ?? "No brand data yet"}
          label="Needs attention"
          value={formatMetric(
            laggard ? getMetricValue(laggard, metric) : null,
            metric,
          )}
        />
      </div>

      <ChartPanel
        config={config}
        report={report}
        sortDirection={sortDirection}
      />
    </section>
  );
}

function ComparisonPage({
  brands,
}: {
  brands: BrandReportRow[];
}) {
  return (
    <section className="card adaptivePanel">
      <div className="cardHeader">
        <div>
          <p className="eyebrow">Copilot comparison</p>
          <h2>Company comparison</h2>
          <p>Side-by-side Peec metrics for the selected companies.</p>
        </div>
      </div>

      <div className="comparisonGrid">
        {brands.map((brand) => (
          <article className="comparisonCard" key={brandKey(brand)}>
            <h3>{brand.brandName}</h3>
            <dl>
              {metricConfigs.map((config) => (
                <div key={config.key}>
                  <dt>{config.label}</dt>
                  <dd>
                    {formatMetric(
                      getMetricValue(brand, config.key),
                      config.key,
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [activeCompanyKey, setActiveCompanyKey] = useState("overview");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("overview");
  const [focusedMetric, setFocusedMetric] =
    useState<ChartMetric>("visibility");
  const [companySort, setCompanySort] = useState<CompanySort>({
    direction: "desc",
    metric: "visibility",
  });
  const [comparisonKeys, setComparisonKeys] = useState<string[]>([]);
  const [copilotStatus, setCopilotStatus] = useState("");
  const [pendingScrollTarget, setPendingScrollTarget] =
    useState<ScrollTarget | null>(null);
  const [report, setReport] = useState<BrandReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const projectCardRef = useRef<HTMLElement | null>(null);
  const companyNavRef = useRef<HTMLElement | null>(null);
  const mainViewRef = useRef<HTMLDivElement | null>(null);

  const endDate = useMemo(() => formatDate(new Date()), []);
  const startDate = useMemo(() => thirtyDaysAgo(), []);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  useEffect(() => {
    getJson<ProjectsResponse>("/api/peec/projects")
      .then((data) => {
        const nextProjects = normalizeProjects(data);
        setProjects(nextProjects);
        setSelectedProjectId(nextProjects[0]?.id ?? "");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setReport([]);
      return;
    }

    const params = new URLSearchParams({
      endDate,
      projectId: selectedProjectId,
      startDate,
    });

    getJson<ReportResponse>(`/api/peec/brands-report?${params}`)
      .then((data) => setReport(normalizeReport(data)))
      .catch((requestError: Error) => setError(requestError.message));
  }, [endDate, selectedProjectId, startDate]);

  useEffect(() => {
    setActiveCompanyKey("overview");
    setViewMode("overview");
    setComparisonKeys([]);
    setCopilotStatus("");
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeCompanyKey === "overview") {
      return;
    }

    const hasCompany = report.some(
      (brand) => brandKey(brand) === activeCompanyKey,
    );

    if (!hasCompany) {
      setActiveCompanyKey("overview");
      setViewMode("overview");
    }
  }, [activeCompanyKey, report]);

  const selectedCompany = useMemo(
    () => report.find((brand) => brandKey(brand) === activeCompanyKey),
    [activeCompanyKey, report],
  );
  const averageVisibility = average(
    report.map((brand) => brand.visibility),
  );
  const averageShareOfVoice = average(
    report.map((brand) => brand.shareOfVoice),
  );
  const topVisibilityBrand = getTopBrand(report, "visibility");
  const topPositionBrand = getTopBrand(report, "position");
  const sortedReport = useMemo(
    () => sortReport(report, companySort.metric, companySort.direction),
    [companySort.direction, companySort.metric, report],
  );
  const comparisonBrands = useMemo(
    () =>
      comparisonKeys
        .map((key) => report.find((brand) => brandKey(brand) === key))
        .filter((brand): brand is BrandReportRow => Boolean(brand)),
    [comparisonKeys, report],
  );

  useEffect(() => {
    if (!pendingScrollTarget) {
      return;
    }

    const targets = {
      companyNav: companyNavRef.current,
      mainView: mainViewRef.current,
      projectCard: projectCardRef.current,
    };
    const timeoutId = window.setTimeout(() => {
      targets[pendingScrollTarget]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setPendingScrollTarget(null);
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [
    comparisonBrands.length,
    pendingScrollTarget,
    report.length,
    selectedProjectId,
    viewMode,
  ]);

  const findBrand = useCallback(
    (key: string) => {
      const normalizedKey = key.trim().toLowerCase();

      return report.find((brand) => {
        const exactKey = brandKey(brand).toLowerCase();
        const name = brand.brandName.toLowerCase();

        return exactKey === normalizedKey || name === normalizedKey;
      });
    },
    [report],
  );
  const showOverview = useCallback(
    (message = "Copilot returned to overview.") => {
      setActiveCompanyKey("overview");
      setViewMode("overview");
      setComparisonKeys([]);
      setCopilotStatus(message);
      setPendingScrollTarget("mainView");
    },
    [],
  );
  const resetDashboard = useCallback(() => {
    setActiveCompanyKey("overview");
    setViewMode("overview");
    setComparisonKeys([]);
    setCopilotStatus("");
    setPendingScrollTarget("mainView");
  }, []);
  const selectCompany = useCallback(
    (companyKey: string) => {
      const brand = findBrand(companyKey);

      if (!brand) {
        return `No company matched "${companyKey}".`;
      }

      setActiveCompanyKey(brandKey(brand));
      setViewMode("company");
      setComparisonKeys([]);
      setCopilotStatus(`Copilot opened ${brand.brandName}.`);
      setPendingScrollTarget("mainView");

      return `Opened the company page for ${brand.brandName}.`;
    },
    [findBrand],
  );
  const focusMetric = useCallback((metric: string) => {
    if (!isChartMetric(metric)) {
      return `Unknown metric "${metric}".`;
    }

    setFocusedMetric(metric);
    setActiveCompanyKey("overview");
    setViewMode("metricFocus");
    setCopilotStatus(`Copilot focused ${getMetricConfig(metric).label}.`);
    setPendingScrollTarget("mainView");

    return `Focused the dashboard on ${getMetricConfig(metric).label}.`;
  }, []);
  const compactBrands = useMemo(
    () =>
      report.slice(0, 25).map((brand) => ({
        key: brandKey(brand),
        name: brand.brandName,
        position: brand.position,
        sentiment: brand.sentiment,
        shareOfVoice: brand.shareOfVoice,
        visibility: brand.visibility,
      })),
    [report],
  );
  const dashboardContext = useMemo(
    () => ({
      availableActions: [
        "selectProject",
        "showOverview",
        "selectCompany",
        "focusMetric",
        "sortCompanies",
        "compareCompanies",
      ],
      brands: compactBrands,
      dateRange: { endDate, startDate },
      focusedMetric,
      metrics: metricConfigs.map((config) => config.key),
      selectedCompany: selectedCompany?.brandName ?? null,
      selectedProject: selectedProject
        ? { id: selectedProject.id, name: selectedProject.name }
        : null,
      sort: companySort,
      viewMode,
    }),
    [
      compactBrands,
      companySort,
      endDate,
      focusedMetric,
      selectedCompany,
      selectedProject,
      startDate,
      viewMode,
    ],
  );

  useCopilotReadable(
    {
      description: "Current Peec dashboard state and visible brand metrics.",
      value: dashboardContext,
    },
    [dashboardContext],
  );

  useCopilotAdditionalInstructions(
    {
      instructions: [
        "Use frontend actions to adapt the dashboard when useful.",
        "Valid metrics are visibility, shareOfVoice, sentiment, and position.",
        "Use company keys from the readable dashboard context.",
        "Prefer UI actions over describing manual click steps.",
      ].join(" "),
    },
    [],
  );

  useFrontendTool(
    {
      description: "Switch the dashboard to one of the loaded Peec projects.",
      handler: ({ projectId }) => {
        const project = projects.find((item) => item.id === projectId);

        if (!project) {
          return `No project matched "${projectId}".`;
        }

        setSelectedProjectId(project.id);
        setCopilotStatus(`Copilot switched to ${project.name}.`);
        setPendingScrollTarget("projectCard");

        return `Selected project ${project.name}.`;
      },
      name: "selectProject",
      parameters: [
        {
          description: "The exact project id from dashboard context.",
          name: "projectId",
          required: true,
          type: "string",
        },
      ],
    },
    [projects],
  );

  useFrontendTool(
    {
      description: "Return the dashboard to the brand report overview.",
      handler: () => {
        showOverview();
        return "Returned to the overview charts.";
      },
      name: "showOverview",
      parameters: [],
    },
    [showOverview],
  );

  useFrontendTool(
    {
      description: "Open a company-specific page in the dashboard.",
      handler: ({ companyKey }) => selectCompany(companyKey),
      name: "selectCompany",
      parameters: [
        {
          description: "The company key or exact company name.",
          name: "companyKey",
          required: true,
          type: "string",
        },
      ],
    },
    [selectCompany],
  );

  useFrontendTool(
    {
      description: "Focus the dashboard on one Peec metric.",
      handler: ({ metric }) => focusMetric(metric),
      name: "focusMetric",
      parameters: [
        {
          description: "One of visibility, shareOfVoice, sentiment, position.",
          enum: metricConfigs.map((config) => config.key),
          name: "metric",
          required: true,
          type: "string",
        },
      ],
    },
    [focusMetric],
  );

  useFrontendTool(
    {
      description: "Sort company cards and chart rows by a Peec metric.",
      handler: ({ direction, metric }) => {
        if (!isChartMetric(metric)) {
          return `Unknown metric "${metric}".`;
        }

        const nextDirection = direction === "asc" ? "asc" : "desc";
        setCompanySort({ direction: nextDirection, metric });
        setViewMode("overview");
        setCopilotStatus(
          `Copilot sorted companies by ${getMetricConfig(metric).label}.`,
        );
        setPendingScrollTarget("companyNav");

        return `Sorted companies by ${metric} ${nextDirection}.`;
      },
      name: "sortCompanies",
      parameters: [
        {
          description: "One of visibility, shareOfVoice, sentiment, position.",
          enum: metricConfigs.map((config) => config.key),
          name: "metric",
          required: true,
          type: "string",
        },
        {
          description: "Sort direction.",
          enum: ["asc", "desc"],
          name: "direction",
          required: true,
          type: "string",
        },
      ],
    },
    [],
  );

  useFrontendTool(
    {
      description: "Compare selected companies in the main dashboard area.",
      handler: ({ companyKeys }) => {
        const brands = companyKeys
          .map((key) => findBrand(key))
          .filter((brand): brand is BrandReportRow => Boolean(brand));

        if (brands.length < 2) {
          return "Choose at least two valid company keys to compare.";
        }

        setComparisonKeys(brands.map((brand) => brandKey(brand)));
        setActiveCompanyKey("overview");
        setViewMode("comparison");
        setCopilotStatus(
          `Copilot compared ${
            brands.map((brand) => brand.brandName).join(", ")
          }.`,
        );
        setPendingScrollTarget("mainView");

        return `Comparing ${
          brands.map((brand) => brand.brandName).join(", ")
        }.`;
      },
      name: "compareCompanies",
      parameters: [
        {
          description: "Company keys or exact company names to compare.",
          name: "companyKeys",
          required: true,
          type: "string[]",
        },
      ],
    },
    [findBrand],
  );

  return (
    <div className="appFrame">
      <main className="shell">
        <section className="hero">
          <div>
            <p className="eyebrow">GoGeo</p>
            <h1>AI search intelligence for every company you track.</h1>
            <p>
              Compare visibility, share of voice, sentiment, and ranking
              position across the selected project. Powered by Peec AI.
            </p>
          </div>
          <div className="heroPanel">
            <span>Selected project</span>
            <strong>{selectedProject?.name ?? "Loading project"}</strong>
            <p>{startDate} to {endDate}</p>
          </div>
        </section>

        {error ? <div className="notice">{error}</div> : null}
        {copilotStatus ? (
          <div className="notice copilotNotice">
            <span>{copilotStatus}</span>
            <button onClick={resetDashboard} type="button">
              Reset dashboard
            </button>
          </div>
        ) : null}

        <section className="card projectCard" ref={projectCardRef}>
          <div className="cardHeader">
            <div>
              <h2>Projects</h2>
              <p>Choose a project to load company pages and charts.</p>
            </div>
            {isLoading ? <span className="pill">Loading</span> : null}
          </div>

          <select
            disabled={!projects.length}
            onChange={(event) => {
              setSelectedProjectId(event.target.value);
              setPendingScrollTarget("projectCard");
            }}
            value={selectedProjectId}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.status ? ` (${project.status})` : ""}
              </option>
            ))}
          </select>
        </section>

        <section className="statsGrid">
          <StatTile
            detail="Average across returned brands"
            label="Visibility"
            value={percent(averageVisibility)}
          />
          <StatTile
            detail="Average across returned brands"
            label="Share of voice"
            value={percent(averageShareOfVoice)}
          />
          <StatTile
            detail={topVisibilityBrand?.brandName ?? "No brand data yet"}
            label="Top visibility"
            value={percent(topVisibilityBrand?.visibility ?? null)}
          />
          <StatTile
            detail={topPositionBrand?.brandName ?? "No brand data yet"}
            label="Best position"
            value={numberValue(topPositionBrand?.position ?? null)}
          />
        </section>

        <section className="card companyNavCard" ref={companyNavRef}>
          <div className="cardHeader">
            <div>
              <h2>Company pages</h2>
              <p>
                Switch from the overview into a company-specific subpage.
              </p>
            </div>
          </div>

          <div className="companyNav">
            <button
              className={viewMode === "overview" ? "isActive" : ""}
              onClick={resetDashboard}
              type="button"
            >
              Overview
            </button>
            {sortedReport.map((brand) => (
              <CompanyCard
                brand={brand}
                isActive={
                  viewMode === "company" && activeCompanyKey === brandKey(brand)
                }
                key={brandKey(brand)}
                onSelect={() => {
                  setActiveCompanyKey(brandKey(brand));
                  setViewMode("company");
                  setCopilotStatus("");
                  setPendingScrollTarget("mainView");
                }}
              />
            ))}
          </div>
        </section>

        <div className="scrollTarget" ref={mainViewRef}>
          {viewMode === "company" && selectedCompany ? (
            <CompanyPage brand={selectedCompany} />
          ) : viewMode === "metricFocus" ? (
            <MetricFocusView
              metric={focusedMetric}
              report={report}
              sortDirection={companySort.direction}
            />
          ) : viewMode === "comparison" && comparisonBrands.length ? (
            <ComparisonPage brands={comparisonBrands} />
          ) : (
            <section className="card">
              <div className="cardHeader">
                <div>
                  <h2>Brand report overview</h2>
                  <p>
                    Beautiful graph views for the last 30 days of Peec metrics.
                  </p>
                </div>
              </div>

              <div className="chartGrid">
                {metricConfigs.map((config) => (
                  <ChartPanel
                    config={config}
                    key={config.key}
                    report={sortedReport}
                    sortDirection={companySort.direction}
                  />
                ))}
              </div>

              {!report.length && !error ? (
                <p className="empty">No brand report rows returned yet.</p>
              ) : null}
            </section>
          )}
        </div>
      </main>

      <Chatbot />
    </div>
  );
}
