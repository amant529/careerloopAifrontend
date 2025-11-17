/**************** CONFIG ****************/
const BACKEND = "https://careerloopaibackend.onrender.com"; // change if needed
const $ = (id) => document.getElementById(id);

function toast(msg, t = 3000) {
  const el = $("toast");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), t);
}

/**************** VISITOR ID + ANALYTICS HELPERS ****************/
function getVisitorId() {
  let vid = localStorage.getItem("cl_vid");
  if (!vid) {
    vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cl_vid", vid);
  }
  return vid;
}

async function trackVisit(page = "home") {
  try {
    await fetch(`${BACKEND}/api/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: getVisitorId(), page }),
    });
  } catch (e) {
    console.log("analytics visit error", e);
  }
}

async function trackEvent(event_type, email = null) {
  try {
    await fetch(`${BACKEND}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitor_id: getVisitorId(),
        email,
        event_type,
      }),
    });
  } catch (e) {
    console.log("analytics event error", e);
  }
}

/**************** AUTH STATE ****************/
function requireAuth() {
  const email = localStorage.getItem("cl_user");
  if (!email) {
    $("login").classList.add("page-active");
    $("mainWrapper").classList.add("hidden");
    return;
  }
  $("userEmailLabel").textContent = email;
  $("login").classList.remove("page-active");
  $("mainWrapper").classList.remove("hidden");
  const pageId = (location.hash || "#home").replace("#", "");
  showPage(pageId);
  trackVisit(pageId);
}

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("page-active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("page-active");
  trackVisit(id);
}

/**************** LOGIN UI TOGGLE ****************/
function toggleLogin(secure) {
  $("quickLogin").classList.toggle("hidden", secure);
  $("secureLogin").classList.toggle("hidden", !secure);
}

$("switchSecure").onclick = (e) => {
  e.preventDefault();
  toggleLogin(true);
};

$("switchQuick").onclick = (e) => {
  e.preventDefault();
  toggleLogin(false);
};

/**************** QUICK LOGIN ****************/
$("quickLoginBtn").onclick = () => {
  const email = $("loginEmail").value.trim();
  if (!email.includes("@")) return toast("Enter valid email");
  localStorage.setItem("cl_user", email);
  requireAuth();
};

/**************** SECURE LOGIN (OTP) – if backend has it, else this is harmless **************/
$("sendOtpBtn")?.addEventListener("click", async () => {
  const email = $("secureEmail").value.trim();
  if (!email.includes("@")) return toast("Enter valid email");

  try {
    await fetch(`${BACKEND}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    toast("OTP sent to your email");
    $("otpInput").classList.remove("hidden");
    $("verifyOtpBtn").classList.remove("hidden");
  } catch {
    toast("Failed to send OTP");
  }
});

$("verifyOtpBtn")?.addEventListener("click", async () => {
  const email = $("secureEmail").value.trim();
  const otp = $("otpInput").value.trim();
  if (!otp) return toast("Enter OTP");

  try {
    const res = await fetch(`${BACKEND}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) {
      toast("Invalid or expired OTP");
      return;
    }
    localStorage.setItem("cl_user", email);
    requireAuth();
  } catch {
    toast("OTP verify failed");
  }
});

/**************** LOGOUT ****************/
$("logoutBtn").onclick = () => {
  localStorage.removeItem("cl_user");
  location.reload();
};

/**************** NAV ROUTING ****************/
window.addEventListener("hashchange", () => {
  const id = (location.hash || "#home").replace("#", "");
  showPage(id);
});

document.querySelectorAll("[data-route]").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const hash = a.getAttribute("href");
    location.hash = hash;
  });
});

/**************** RESUME BUILDER ****************/
$("genResume").onclick = async () => {
  const name = $("b_name").value.trim();
  const email = $("b_email").value.trim() || localStorage.getItem("cl_user");
  if (!name || !email) return toast("Name & email required");
  if (!$("b_consent").checked) return toast("Consent required");

  const payload = {
    name,
    email,
    target_role: $("b_role").value.trim(),
    experience_level: $("b_exp").value.trim(),
    achievements: $("b_achieve").value.trim(),
    skills: $("b_skills").value.trim(),
    projects: $("b_proj").value.trim(),
    education: $("b_edu").value.trim(),
    certifications: $("b_cert").value.trim(),
    extras: $("b_extra").value.trim(),
    consent: true,
  };

  $("resumePreview").innerHTML = "<p class='muted'>Generating resume...</p>";

  try {
    const res = await fetch(`${BACKEND}/api/builder/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error");
    $("resumePreview").textContent = data.resume;

    // 🔹 Analytics: resume generated
    trackEvent("resume_generated", email);

  } catch (err) {
    toast(err.message);
    $("resumePreview").innerHTML = "<p class='muted'>Error generating resume</p>";
  }
};

$("saveResumeBtn").onclick = async () => {
  const email = localStorage.getItem("cl_user");
  const resume = $("resumePreview").textContent.trim();
  if (!resume) return toast("Generate resume first");

  try {
    await fetch(`${BACKEND}/api/builder/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resume }),
    });
    toast("Resume saved");
  } catch {
    toast("Save failed");
  }
};

$("downloadPdfBtn").onclick = () => {
  const text = $("resumePreview").textContent.trim();
  if (!text) return toast("Generate resume first");
  const w = window.open("", "_blank");
  w.document.write(`<pre style="font-family:Arial;white-space:pre-wrap;">${text}</pre>`);
  w.print();
};

/**************** SINGLE SCREENING ****************/
$("screenSingleBtn").onclick = async () => {
  const job_description = $("singleJD").value.trim();
  const resume_text = $("singleResume").value.trim();
  if (!job_description || !resume_text) return toast("Enter JD & Resume");

  $("singleScreenResult").classList.remove("hidden");
  $("singleScreenResult").innerHTML = "Processing...";

  try {
    const res = await fetch(`${BACKEND}/api/screen/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description, resume_text }),
    });
    const data = await res.json();
    $("singleScreenResult").innerHTML = `<b>Score:</b> ${data.score}/100<br><br>${data.summary}`;

    // 🔹 Analytics: single screening
    const email = localStorage.getItem("cl_user");
    trackEvent("screen_single", email);

  } catch {
    $("singleScreenResult").innerHTML = "Error running screening";
  }
};

/**************** BULK SCREENING ****************/
$("screenBulkBtn").onclick = async () => {
  const jd = $("bulkJD").value.trim();
  const files = $("bulkFiles").files;
  if (!jd || files.length === 0) return toast("Enter JD and attach files");

  $("bulkScreenResult").classList.remove("hidden");
  $("bulkScreenResult").innerHTML = "Uploading & analyzing...";

  const fd = new FormData();
  fd.append("jd", jd);
  for (const f of files) fd.append("files", f);

  try {
    const res = await fetch(`${BACKEND}/api/screen/bulk`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    $("bulkScreenResult").innerHTML = `<pre>${JSON.stringify(data.results, null, 2)}</pre>`;

    // 🔹 Analytics: bulk screening
    const email = localStorage.getItem("cl_user");
    trackEvent("screen_bulk", email);

  } catch {
    $("bulkScreenResult").innerHTML = "Error analyzing";
  }
};

/**************** SUBSCRIPTION + CONFETTI ****************/
function celebrate() {
  confetti({
    particleCount: 220,
    spread: 120,
    origin: { y: 0.6 },
    colors: ["#6c5ce7", "#b26efb", "#ffeaa7", "#00cec9"],
  });
}

$("claimSubBtn").onclick = async () => {
  const email = localStorage.getItem("cl_user");
  if (!email) return toast("Login first");

  try {
    const res = await fetch(`${BACKEND}/api/admin/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Subscribe failed");
    celebrate();
    toast("Subscription activated!");
    $("claimSubBtn").disabled = true;
    $("claimSubBtn").textContent = "Activated ✔";
  } catch {
    toast("Subscription error");
  }
};

/**************** INIT ****************/
requireAuth();

/**************** BACKGROUND WAVE ANIMATION ****************/
const canvas = document.getElementById("bgWaveCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.onresize = resizeCanvas;

let t = 0;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i === 0 ? "#6c5ce7ff" : i === 1 ? "#b26efbff" : "#5dade2ff";

    const amplitude = 40 + i * 15;
    const wavelength = 0.01 + i * 0.005;
    const yOffset = canvas.height * 0.7 + i * 25;

    for (let x = 0; x < canvas.width; x++) {
      const y = yOffset + Math.sin(x * wavelength + t + i) * amplitude;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  t += 0.015;
  requestAnimationFrame(draw);
}

draw();
