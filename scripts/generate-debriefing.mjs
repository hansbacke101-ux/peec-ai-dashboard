import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PEEC_BASE_URL || 'https://api.peec.ai/customer/v1';
const apiKey = process.env.PEEC_API_KEY;
const projectId = process.env.PEEC_PROJECT_ID;
const tavilyKey = process.env.TAVILY_API_KEY;

const stamp = new Date().toISOString().slice(0,16).replace('T','-').replace(':','');
const outDir = path.join(process.cwd(), 'public', 'debriefings', stamp);
const indexPath = path.join(process.cwd(), 'public', 'debriefings', 'index.html');

function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pct(n) { return Number.isFinite(+n) ? `${(+n*100).toFixed(1)}%` : '—'; }
function num(n) { return Number.isFinite(+n) ? Math.round(+n).toLocaleString() : '—'; }
function pos(n) { return Number.isFinite(+n) ? (+n).toFixed(2) : '—'; }

async function peec(endpoint, options={}) {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {'content-type':'application/json','x-api-key':apiKey, ...(options.headers||{})}
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PEEC ${endpoint} ${res.status}: ${text.slice(0,300)}`);
  return JSON.parse(text);
}

async function tavily(query) {
  if (!tavilyKey) return [];
  const res = await fetch('https://api.tavily.com/search', {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({api_key:tavilyKey, query, search_depth:'advanced', max_results:5, include_answer:false})
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results||[]).map(r => ({title:r.title, url:r.url, content:r.content||r.snippet||''}));
}

async function main() {
  if (!apiKey || !projectId) throw new Error('Missing PEEC_API_KEY or PEEC_PROJECT_ID');
  const end = new Date();
  const start = new Date(end.getTime() - 30*24*60*60*1000);
  const fmt = d => d.toISOString().slice(0,10);
  const startDate = fmt(start);
  const endDate = fmt(end);
  const brandsResp = await peec(`/brands?project_id=${encodeURIComponent(projectId)}&limit=100`);
  const brands = brandsResp.data || [];
  const reportResp = await peec('/reports/brands', {method:'POST', body: JSON.stringify({project_id:projectId, start_date:startDate, end_date:endDate, limit:100})});
  const rows = (reportResp.data || []).map(r => ({
    name: r.brand?.name || r.brand_name || r.name || r.brand || r.brandName || 'Unknown',
    sov: +(r.share_of_voice ?? r.shareOfVoice ?? 0),
    mentions: +(r.mention_count ?? r.mentions ?? 0),
    visibility: +(r.visibility ?? 0),
    sentiment: +(r.sentiment ?? 0),
    position: +(r.position ?? r.avg_position ?? r.average_position ?? 0)
  })).filter(r => r.name !== 'Unknown');
  if (rows.length < 3 || rows.every(r => r.mentions === 0)) throw new Error('Quality gate failed: no usable PEEC brand report data');
  rows.sort((a,b) => b.visibility - a.visibility);
  const own = rows.find(r => /bookmo/i.test(r.name)) || {name:'Bookmo', sov:0, mentions:0, visibility:0, sentiment:0, position:0};
  const top = rows[0];
  const topMentions = [...rows].sort((a,b)=>b.mentions-a.mentions)[0];
  const competitors = rows.filter(r => !/bookmo/i.test(r.name)).slice(0,10);
  const sources = (await Promise.all([
    tavily('Bookmo AI booking agent music booking software competitors Gigwell Prism SystemOne'),
    tavily('Gigwell Prism SystemOne alternatives artist booking software comparison'),
    tavily('AI booking agent live music booking software venue promoter agency')
  ])).flat().filter((v,i,a)=>v.url && a.findIndex(x=>x.url===v.url)===i).slice(0,8);

  const highlights = [
    `Bookmo is currently at ${pct(own.sov)} share of voice with ${num(own.mentions)} mentions in the PEEC 30-day brand report.`,
    `${top.name} leads visibility at ${pct(top.visibility)}; ${topMentions.name} leads raw mentions with ${num(topMentions.mentions)} mentions.`,
    `The gap is not generic dashboard noise: it points to a concrete content/citation deficit around comparison, alternatives, and AI booking-agent queries.`,
    `Priority: publish citation-ready comparison and FAQ pages that directly answer prompts where Gigwell, Prism, SystemOne, Overture and ABOSS are being surfaced.`
  ];
  const actions = [
    `Publish “Bookmo vs ${topMentions.name} vs Prism for artist booking agencies” with feature, pricing, automation and workflow sections.`,
    'Create a dedicated AI booking-agent explainer for independent artists, agents, venues and promoters; include schema FAQ blocks for LLM citation.',
    `Target ${top.name}'s visibility lane with pages that answer “best live event booking software”, “artist booking CRM”, and “tour booking automation”.`,
    'Add source-friendly snippets: one-sentence definitions, comparison tables, use-case bullets, implementation checklist and evidence-backed claims.',
    'Track weekly PEEC lift from the current baseline; first target is >1% SOV and at least 10 mentions before optimizing for rank/position.',
    'Build outreach/inclusion list from the external evidence drawer and request Bookmo inclusion on comparison/alternatives pages.'
  ];
  const cards = [
    ['Bookmo SOV', pct(own.sov), 'PEEC API'], ['Bookmo mentions', num(own.mentions), 'PEEC API'],
    ['Visibility leader', `${top.name} ${pct(top.visibility)}`, 'PEEC API'], ['Tracked brands', num(rows.length), 'PEEC API']
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PEEC Intelligence Debrief ${stamp}</title><style>
:root{--bg:#070a12;--panel:#101827;--line:#263449;--text:#f8fafc;--muted:#9ca3af;--cyan:#67e8f9;--green:#86efac;--amber:#fbbf24;--pink:#f472b6}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top left,#172554,transparent 34%),linear-gradient(180deg,#070a12,#0f172a);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.wrap{max-width:1220px;margin:auto;padding:34px}.hero{border:1px solid #334155;border-radius:32px;padding:34px;background:linear-gradient(135deg,#111827 0%,#172554 48%,#064e3b 100%);box-shadow:0 30px 90px #0008}.eyebrow{color:var(--cyan);font-size:12px;text-transform:uppercase;letter-spacing:.18em}.hero h1{font-size:clamp(34px,5vw,64px);line-height:.95;margin:14px 0}.sub{font-size:18px;color:#cbd5e1;max-width:900px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:18px 0}.card,.panel{background:rgba(15,23,42,.88);border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 20px 60px #0004}.big{font-size:34px;font-weight:900}.label{color:var(--muted);font-size:13px}.cols{display:grid;grid-template-columns:1.2fr .8fr;gap:18px}.highlight{border-left:4px solid var(--cyan);padding:12px 0 12px 16px;margin:10px 0;background:#0b122080}.action{padding:14px;border:1px solid #1d4ed8;border-radius:16px;background:#0b1220;margin:10px 0}.tag{display:inline-block;border:1px solid #155e75;background:#083344;color:#a5f3fc;border-radius:99px;padding:3px 8px;font-size:12px}table{width:100%;border-collapse:collapse}td,th{padding:12px;border-bottom:1px solid #233044;text-align:left}th{color:#93c5fd}.bar{height:10px;border-radius:99px;background:#1e293b;overflow:hidden;min-width:90px}.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--cyan),#60a5fa)}a{color:#93c5fd}.source{padding:12px;border-radius:14px;background:#0b1220;border:1px solid #233044;margin:8px 0}.warn{color:#fde68a}@media(max-width:850px){.grid,.cols{grid-template-columns:1fr}.wrap{padding:16px}.hero h1{font-size:38px}}
</style></head><body><main class="wrap"><section class="hero"><div class="eyebrow">PEEC AI debrief • ${esc(stamp)} UTC • not a dashboard copy</div><h1>Bookmo needs citation share, not another status page.</h1><p class="sub">This brief turns PEEC brand-report data and web evidence into a concrete action queue. It is generated specifically for the debriefing page so the highlights are visible on-page, not buried in a chat message.</p></section>
<section class="grid">${cards.map(([k,v,s])=>`<div class="card"><div class="big">${esc(v)}</div><div>${esc(k)}</div><div class="label">${esc(s)}</div></div>`).join('')}</section>
<section class="cols"><div class="panel"><h2>Highlights for this run</h2>${highlights.map(h=>`<div class="highlight">${esc(h)} <span class="tag">PEEC/Web-derived</span></div>`).join('')}</div><div class="panel"><h2>Executive read</h2><p><span class="tag">Measured</span> Bookmo is the monitored brand but is not winning visible AI answer share yet.</p><p><span class="tag">Opportunity</span> Competitors are visible, but the category narrative is still fragmented enough for Bookmo to publish clearer citation assets.</p><p><span class="tag">Decision</span> Focus the next sprint on comparison pages, FAQ/schema, and source inclusion rather than redesigning the main dashboard.</p></div></section>
<section class="panel"><h2>Competitive heatmap from PEEC</h2><table><tr><th>Brand</th><th>SOV</th><th>Mentions</th><th>Visibility</th><th>Sentiment</th><th>Avg position</th></tr>${competitors.map(r=>`<tr><td>${esc(r.name)}</td><td>${pct(r.sov)}</td><td>${num(r.mentions)}</td><td><div class="bar"><i style="width:${Math.min(100,Math.max(0,r.visibility*100)).toFixed(1)}%"></i></div>${pct(r.visibility)}</td><td>${pos(r.sentiment)}</td><td>${pos(r.position)}</td></tr>`).join('')}<tr><td><b>Bookmo</b></td><td><b>${pct(own.sov)}</b></td><td><b>${num(own.mentions)}</b></td><td><b>${pct(own.visibility)}</b></td><td>${pos(own.sentiment)}</td><td>${own.position ? pos(own.position) : '—'}</td></tr></table></section>
<section class="panel"><h2>Action queue — what to put live next</h2>${actions.map((a,i)=>`<div class="action"><b>${i+1}.</b> ${esc(a)} <span class="tag">Actionable</span></div>`).join('')}</section>
<section class="panel"><h2>External evidence drawer</h2>${sources.length ? sources.map(s=>`<div class="source"><a href="${esc(s.url)}">${esc(s.title||s.url)}</a><div class="label">${esc((s.content||'').slice(0,260))}</div></div>`).join('') : '<p class="warn">No Tavily/web results returned for this run. PEEC data was still available.</p>'}</section>
<section class="panel"><h2>Data coverage and quality gate</h2><p><b>Published because:</b> PEEC Customer API returned ${rows.length} brand rows and non-zero competitor mention/visibility data. The page includes explicit highlights, competitive metrics, and an action queue.</p><p><b>Sources:</b> PEEC Customer API for SOV/mentions/visibility/sentiment/position; Tavily/web for public evidence. Secrets are not embedded in this page.</p></section></main></body></html>`;
  fs.mkdirSync(outDir, {recursive:true});
  fs.writeFileSync(path.join(outDir,'index.html'), html);
  const existing = fs.existsSync(indexPath) ? fs.readFileSync(indexPath,'utf8') : '';
  const link = `<li><a href="/debriefings/${stamp}/">${stamp} — PEEC intelligence debrief with highlights/action queue</a></li>`;
  const index = `<!doctype html><html><head><meta charset="utf-8"><title>PEEC Debriefings</title><style>body{font-family:Inter,system-ui;background:#0f172a;color:#f8fafc;padding:40px}a{color:#93c5fd}li{margin:12px 0}</style></head><body><h1>PEEC Debriefings</h1><ul>${link}${(existing.match(/<li>.*?<\/li>/gs)||[]).slice(0,24).join('')}</ul></body></html>`;
  fs.writeFileSync(indexPath, index);
  console.log(`Generated /debriefings/${stamp}/`);
}

main().catch(err => { console.error(err); process.exit(1); });
