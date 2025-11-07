// ====== Boot ======
document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  const splash = document.getElementById("splash");
  if (splash) setTimeout(() => splash.classList.add("hidden"), 5000);

  const savedTheme = localStorage.getItem("clai-theme");
  if (savedTheme === "light") document.documentElement.classList.add("light");
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  const id = "tsparticles";
  const el = document.getElementById(id);
  if (el && window.tsParticles) {
    tsParticles.load({
      id,
      options: {
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          number: { value: 60, density: { enable: true, area: 900 } },
          shape: { type: "circle" }, opacity: { value: 0.4 },
          size: { value: { min: 1, max: 3 } }, move: { enable: true, speed: 0.6 },
          links: { enable: true, distance: 120, opacity: 0.2 }
        },
        interactivity: { events: { onHover: { enable: true, mode: "grab" }, resize: true },
          modes: { grab: { distance: 140, links: { opacity: 0.35 } } } },
        detectRetina: true, fullScreen: { enable: true, zIndex: -1 }
      }
    });
  }

  if (document.getElementById("kpiChart")) initDashboard();
  if (document.getElementById("pfName")) loadProfile();

  const iframe = document.getElementById("resumePreview");
  if (iframe) updatePreview();
});

function toggleTheme(){
  const root = document.documentElement;
  root.classList.toggle("light");
  localStorage.setItem("clai-theme", root.classList.contains("light") ? "light" : "dark");
}

// ====== Builder ======
function generateResume() {
  const form = document.getElementById("builderForm");
  const data = Object.fromEntries(new FormData(form).entries());
  showProgress();

  fetch(ENDPOINTS.generateResume, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, industry: getIndustry(), template: getTemplate() })
  })
  .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
  .then(json => applyDataToPreview(json.resume || data))
  .catch(() => applyDataToPreview(data))
  .finally(hideProgress);
}

function getIndustry(){ const s = document.getElementById("industrySelect"); return s ? s.value : "general"; }
function getTemplate(){ const s = document.getElementById("templateSelect"); return s ? s.value : "modern"; }

function downloadPDF(){ const iframe = document.getElementById("resumePreview"); iframe?.contentWindow?.print(); }

function downloadDOC(){
  const iframe = document.getElementById("resumePreview");
  const html = iframe?.srcdoc || "<html><body></body></html>";
  const blob = new Blob([html], { type: "application/msword" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "resume.doc"; a.click();
}

function applyDataToPreview(data) {
  const iframe = document.getElementById("resumePreview"); if (!iframe) return;
  const tpl = getTemplate();
  const { name="", email="", phone="", title="", summary="", skills="", experience="", education="" } = data;
  const skillsList = (skills||"").split(",").map(s=>s.trim()).filter(Boolean).map(s=>`<span class="badge">${s}</span>`).join(" ");
  const baseCSS = `
    body{font-family:Inter,system-ui;padding:28px;line-height:1.35}
    h1{margin:0} h2{margin:18px 0 6px} .row{display:flex;gap:12px;flex-wrap:wrap}
    .hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #222;padding-bottom:6px;margin-bottom:10px}
    .title{font-weight:700} .muted{opacity:.8} .badge{border:1px solid #666;border-radius:999px;padding:2px 8px;font-size:12px}
  `;
  const tplCSS = {
    modern: baseCSS + ".title{color:#4b5dff} h2{color:#4b5dff}",
    minimal: baseCSS + "body{font-family:Georgia,serif} .badge{border:1px solid #999}",
    ats: baseCSS + "body{font-family:Arial} .hdr{border:none} h2{border-bottom:1px solid #333;padding-bottom:4px}"
  }[tpl] || baseCSS;

  const html = `
    <html><head><meta charset="utf-8"><style>${tplCSS}</style></head>
    <body>
      <div class="hdr"><div><h1>${name}</h1><div class="title">${title}</div></div>
      <div class="muted">${email}${phone ? " · "+phone : ""}</div></div>
      <h2>Summary</h2><p>${summary}</p>
      <h2>Skills</h2><div class="row">${skillsList}</div>
      <h2>Experience</h2><pre style="white-space:pre-wrap">${experience}</pre>
      <h2>Education</h2><pre style="white-space:pre-wrap">${education}</pre>
    </body></html>`;
  iframe.srcdoc = html;
}

function updatePreview(){
  const form = document.getElementById("builderForm");
  if (!form) return;
  applyDataToPreview(Object.fromEntries(new FormData(form).entries()));
}

function scoreKeywords(){
  let jd = localStorage.getItem("clai-last-jd") || "";
  if (!jd) jd = prompt("Paste target Job Description to score against:");
  if (!jd) return;
  const form = document.getElementById("builderForm");
  const data = Object.fromEntries(new FormData(form).entries());
  const text = `${data.summary}\n${data.skills}\n${data.experience}\n${data.education}`.toLowerCase();
  const tokens = Array.from(new Set(jd.toLowerCase().match(/[a-zA-Z0-9\-\+\#\.]{2,}/g)||[]));
  const hits = tokens.filter(t => text.includes(t));
  const score = Math.round((hits.length / Math.max(tokens.length,1)) * 100);
  alert(`Keyword match ≈ ${score}%\nMatched: ${hits.slice(0,30).join(", ")}`);
}

function copyKeywords(){
  const industry = getIndustry();
  const keywords = {
    general:["communication","leadership","project management"],
    software:["JavaScript","React","APIs","CI/CD","Cloud","Accessibility"],
    finance:["Excel","Financial modeling","Forecasting","SQL","Variance analysis"],
    marketing:["SEO","Content","CRM","Paid ads","Attribution"],
    healthcare:["EMR","Clinical","HIPAA","Patient care"]
  }[industry] || [];
  navigator.clipboard.writeText(keywords.join(", "));
  alert("Target keywords copied!");
}

// Tips dialog
function openTips(){
  const dialog = document.getElementById("tipsDialog");
  const list = document.getElementById("tipsList");
  const tips = {
    software:["Quantify impact (-15% LCP)","Stack (React/TS/CI)","Link portfolio"],
    finance:["P&L/ARR/CAC metrics","Excel/SQL models","Forecasting & dashboards"],
    marketing:["ROAS & CAC/LTV","SEO rank & traffic","A/B tests & uplift"],
    healthcare:["Outcomes & throughput","Compliance highlights","EMR & privacy"],
    general:["2 pages max","Metric-driven bullets","Action verbs first"]
  }[getIndustry()];
  list.innerHTML = tips.map(t=>`<li>${t}</li>`).join("");
  dialog.showModal();
}
function closeTips(){ document.getElementById("tipsDialog").close(); }

// Save/Load drafts + Import/Export
function saveDraft(){ const data = Object.fromEntries(new FormData(document.getElementById("builderForm")).entries()); localStorage.setItem("clai-draft", JSON.stringify(data)); alert("Draft saved locally."); }
function loadDraft(){ const raw = localStorage.getItem("clai-draft"); if (!raw) return alert("No draft found."); const d = JSON.parse(raw); const f = document.getElementById("builderForm"); Object.keys(d).forEach(k => { if (f[k]) f[k].value = d[k]; }); updatePreview(); }
function importJSON(){ const raw = prompt("Paste JSON exported from CareerloopAI:"); if (!raw) return; try{ const d = JSON.parse(raw); const f = document.getElementById("builderForm"); Object.keys(d).forEach(k => { if (f[k]) f[k].value = d[k]; }); updatePreview(); }catch(e){ alert("Invalid JSON"); } }
function exportJSON(){ const d = Object.fromEntries(new FormData(document.getElementById("builderForm")).entries()); const blob = new Blob([JSON.stringify(d,null,2)], {type:"application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "careerloopai-resume.json"; a.click(); }

// ====== Screening ======
function sampleResumes(){
  const jd = document.getElementById("jobDesc");
  jd.value = "We need a frontend engineer with JavaScript, HTML, CSS, accessibility, and performance skills. React is a plus.";
  localStorage.setItem("clai-last-jd", jd.value);
}
function screenResumes(){
  const industry = document.getElementById("industryProfile").value;
  const jd = document.getElementById("jobDesc").value;
  localStorage.setItem("clai-last-jd", jd);
  const files = document.getElementById("resumeFiles").files;
  const results = document.getElementById("results");
  showProgress();

  const form = new FormData();
  form.append("industry", industry);
  form.append("job_desc", jd);
  for (const f of files) form.append("files", f);

  fetch(ENDPOINTS.screening, { method:"POST", body: form })
    .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
    .then(json => renderResults(json.results || []))
    .catch(() => {
      renderResults([
        { name:"Aditi Verma.pdf", score:86, match:"Strong JS, CSS", gaps:"Accessibility" },
        { name:"Rahul Shah.pdf", score:74, match:"HTML, performance", gaps:"Testing, React" }
      ]);
    })
    .finally(hideProgress);
}
function renderResults(rows){
  const el = document.getElementById("results");
  if (!rows.length){ el.innerHTML = "<p>No results.</p>"; return; }
  const html = [`<table class="table"><thead><tr><th>Resume</th><th>Score</th><th>Highlights</th><th>Gaps</th></tr></thead><tbody>`,
    ...rows.map(r=>`<tr><td>${r.name||"-"}</td><td><strong>${r.score||0}</strong></td><td>${r.match||"-"}</td><td>${r.gaps||"-"}</td></tr>`),
    `</tbody></table>`].join("");
  el.innerHTML = html;
}

// ====== Dashboard & Manager ======
async function initDashboard(){
  try{
    const r = await fetch(ENDPOINTS.stats);
    const j = await r.json();
    document.getElementById("kpiUsers").textContent = j.users ?? 0;
    document.getElementById("kpiResumes").textContent = j.resumes ?? 0;
    document.getElementById("kpiScreens").textContent = j.screenings ?? 0;
    makeChart(j.activity || [2,5,7,4,9,12,10]);
  }catch(e){
    document.getElementById("kpiUsers").textContent = 1200;
    document.getElementById("kpiResumes").textContent = 3421;
    document.getElementById("kpiScreens").textContent = 876;
    makeChart([2,5,7,4,9,12,10]);
  }
}
function makeChart(series){
  const ctx = document.getElementById("kpiChart");
  if (!ctx || !window.Chart) return;
  new Chart(ctx, { type:"line", data: { labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets:[{ label:"Activity", data:series }] } });
}
function managerAdd(){
  const files = document.getElementById("mgrFiles").files;
  const list = Array.from(files).map(f => ({ name:f.name, size:f.size }));
  const old = JSON.parse(localStorage.getItem("clai-mgr")||"[]");
  const all = old.concat(list);
  localStorage.setItem("clai-mgr", JSON.stringify(all));
  managerRender(all);
}
function managerClear(){ localStorage.removeItem("clai-mgr"); managerRender([]); }
function managerRender(all){
  const el = document.getElementById("mgrTable");
  if (!el) return;
  if (!all.length){ el.innerHTML = "<p>No files.</p>"; return; }
  const html = [`<table class="table"><thead><tr><th>Name</th><th>Size (KB)</th></tr></thead><tbody>`,
    ...all.map(r=>`<tr><td>${r.name}</td><td>${Math.round(r.size/1024)}</td></tr>`), `</tbody></table>`].join("");
  el.innerHTML = html;
}

// ====== Contact ======
function sendContact(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  fetch(ENDPOINTS.contact, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(data)
  }).then(()=> alert("Thanks! We'll get back to you."))
    .catch(()=> alert("Sent (mock). Configure BACKEND_BASE_URL."));
}

// ====== Profile ======
function saveProfile(e){
  e.preventDefault();
  const data = { name: pfName.value, role: pfRole.value, email: pfEmail.value };
  localStorage.setItem("clai-profile", JSON.stringify(data));
  alert("Profile saved locally.");
}
function loadProfile(){
  const raw = localStorage.getItem("clai-profile");
  if (!raw) return;
  const d = JSON.parse(raw);
  pfName.value = d.name || ""; pfRole.value = d.role || ""; pfEmail.value = d.email || "";
}

// ====== Utilities ======
function showProgress(){ document.querySelectorAll("#progress .bar").forEach(b=>b.style.width="30%"); document.querySelectorAll("#progress").forEach(p=>p.classList.remove("hidden")); setTimeout(()=>document.querySelectorAll("#progress .bar").forEach(b=>b.style.width="80%"), 300); }
function hideProgress(){ document.querySelectorAll("#progress .bar").forEach(b=>b.style.width="100%"); setTimeout(()=>document.querySelectorAll("#progress").forEach(p=>p.classList.add("hidden")), 400); }

// Expose to window (called from HTML)
window.generateResume = generateResume;
window.updatePreview = updatePreview;
window.applyTheme = v => document.body.dataset.industry = v;
window.copyKeywords = copyKeywords;
window.openTips = openTips;
window.closeTips = closeTips;
window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.importJSON = importJSON;
window.exportJSON = exportJSON;
window.scoreKeywords = scoreKeywords;
window.sampleResumes = sampleResumes;
window.screenResumes = screenResumes;
window.sendContact = sendContact;
window.managerAdd = managerAdd;
window.managerClear = managerClear;
window.saveProfile = saveProfile;
