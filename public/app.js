// ===========================
// Careerloop AI – Frontend Core JS (No-OTP, Beta Launch)
// ===========================

const BACKEND = "https://careerloopaibackend.onrender.com";

// ---------------------------
// TOKEN + ROLE HELPERS (local only)
// ---------------------------

function saveToken(token) {
  localStorage.setItem("careerloop_token", token);
}
function getToken() {
  return localStorage.getItem("careerloop_token");
}
function clearToken() {
  localStorage.removeItem("careerloop_token");
}

function saveRole(role) {
  localStorage.setItem("careerloop_role", role);
}
function getRole() {
  return localStorage.getItem("careerloop_role");
}

// Gate pages behind "login" (even though token is fake)
function requireAuth() {
  const t = getToken();
  if (!t) {
    window.location.href = "/login.html";
  }
}

// ---------------------------
// ROLE SELECTION (Login page)
// ---------------------------

let selectedRole = null;

function selectRole(role) {
  selectedRole = role;
  saveRole(role);

  const jobBtn = document.getElementById("jobBtn");
  const bizBtn = document.getElementById("bizBtn");

  if (jobBtn) jobBtn.classList.remove("selected");
  if (bizBtn) bizBtn.classList.remove("selected");

  if (role === "jobseeker" && jobBtn) jobBtn.classList.add("selected");
  if (role === "business" && bizBtn) bizBtn.classList.add("selected");
}

// ---------------------------
// NO-OTP TEMPORARY LOGIN
// ---------------------------

function directLogin() {
  const email = document.getElementById("email")?.value.trim();

  if (!selectedRole) {
    alert("Please select Job Seeker or Business / HR.");
    return;
  }
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  const fakeToken = "careerloop_dummy_token_" + Date.now();
  saveRole(selectedRole);
  saveToken(fakeToken);

  if (selectedRole === "business") {
    window.location.href = "/business.html";
  } else {
    window.location.href = "/jobseeker.html";
  }
}

// ---------------------------
// AI RESUME BUILDER
// ---------------------------

async function generateResume() {
  requireAuth();

  const name = document.getElementById("rName")?.value || "";
  const title = document.getElementById("rTitle")?.value || "";
  const experience = document.getElementById("rExp")?.value || "";
  const skills = document.getElementById("rSkills")?.value || "";
  const achievements = document.getElementById("rAch")?.value || "";
  const education = document.getElementById("rEdu")?.value || "";
  const extras = document.getElementById("rExtras")?.value || "";
  const templateId = document.getElementById("rTemplate")?.value || "classic-pro";

  if (!name || !title) {
    alert("At minimum, please enter Name and Job Title.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/api/resume/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        title,
        experience,
        skills,
        achievements,
        education,
        extras,
        templateId
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resume error:", data);
      alert("Failed to generate resume.");
      return;
    }

    document.getElementById("resumeOutput").textContent =
      data.resume || "No resume text returned.";
  } catch (err) {
    console.error("Resume network error:", err);
    alert("Network error while generating resume.");
  }
}

// ---------------------------
// ATS SCREENING (single)
// ---------------------------

async function runATS() {
  requireAuth();

  const resume = document.getElementById("atsResume")?.value || "";
  const jd = document.getElementById("atsJD")?.value || "";

  if (!resume || !jd) {
    alert("Paste both Resume and Job Description.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/api/screening/ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("ATS error:", data);
      alert("Failed to run ATS screening.");
      return;
    }

    document.getElementById("atsResult").textContent = data.result || "";
  } catch (err) {
    console.error("ATS network error:", err);
    alert("Network error while running ATS.");
  }
}

// ---------------------------
// BULK SCREENING (business)
// ---------------------------

async function runBulk() {
  requireAuth();

  const resumes = document.getElementById("bulkResumes")?.value || "";
  const jd = document.getElementById("bulkJD")?.value || "";

  if (!resumes || !jd) {
    alert("Paste resumes and JD.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/api/screening/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumes, jd })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Bulk error:", data);
      alert("Failed bulk screening.");
      return;
    }

    document.getElementById("bulkResult").textContent =
      JSON.stringify(data.candidates || [], null, 2);
  } catch (err) {
    console.error("Bulk network error:", err);
    alert("Network error while running bulk screening.");
  }
}

// ---------------------------
// LOGOUT
// ---------------------------

function logout() {
  clearToken();
  window.location.href = "/login.html";
}
