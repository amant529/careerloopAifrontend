// Backend base URL – your Render backend
const BACKEND = "https://careerloopaibackend.onrender.com";

// ===== TOKEN + ROLE HELPERS =====
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

// Protect pages that need login
function requireAuth() {
  const t = getToken();
  if (!t) {
    window.location.href = "/login.html";
  }
}

// ===== LOGIN PAGE LOGIC =====
let selectedRole = null;

function selectRole(role) {
  selectedRole = role;
  saveRole(role);

  const jobBtn = document.getElementById("jobBtn");
  const bizBtn = document.getElementById("bizBtn");

  if (!jobBtn || !bizBtn) return;

  jobBtn.classList.remove("selected");
  bizBtn.classList.remove("selected");
  if (role === "jobseeker") jobBtn.classList.add("selected");
  else bizBtn.classList.add("selected");
}

async function sendOTP() {
  const emailInput = document.getElementById("email");
  if (!emailInput) return;
  const email = emailInput.value.trim();

  if (!selectedRole) {
    alert("Please select Job Seeker or Business / HR.");
    return;
  }
  if (!email) {
    alert("Please enter an email.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: selectedRole })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Send OTP failed:", txt);
      alert("Failed to send OTP. Check backend logs.");
      return;
    }

    const data = await res.json();
    console.log("OTP response:", data);
    alert("OTP has been sent to your email (check inbox / spam).");
  } catch (err) {
    console.error("Send OTP error:", err);
    alert("Network error while sending OTP.");
  }
}

async function verifyOTP() {
  const email = document.getElementById("email")?.value.trim();
  const otp = document.getElementById("otp")?.value.trim();

  if (!email || !otp) {
    alert("Enter email and OTP.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      console.error("Verify error:", data);
      alert(data.detail || "Wrong OTP.");
      return;
    }

    saveToken(data.token);

    const role = selectedRole || getRole();
    if (role === "business") {
      window.location.href = "/business.html";
    } else {
      window.location.href = "/jobseeker.html";
    }
  } catch (err) {
    console.error("Verify OTP error:", err);
    alert("Network error while verifying OTP.");
  }
}

// ===== RESUME BUILDER =====
async function generateResume() {
  requireAuth();
  const token = getToken();

  const name = document.getElementById("rName")?.value || "";
  const title = document.getElementById("rTitle")?.value || "";
  const experience = document.getElementById("rExp")?.value || "";
  const skills = document.getElementById("rSkills")?.value || "";
  const achievements = document.getElementById("rAch")?.value || "";
  const templateId = document.getElementById("rTemplate")?.value || "classic-pro";

  try {
    const res = await fetch(
      `${BACKEND}/api/resume/generate?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          title,
          experience,
          skills,
          achievements,
          templateId
        })
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("Resume error:", data);
      alert("Failed to generate resume.");
      return;
    }
    document.getElementById("resumeOutput").textContent = data.resume || "";
  } catch (err) {
    console.error("Resume error:", err);
    alert("Network error.");
  }
}

// ===== ATS SCREENING (single) =====
async function runATS() {
  requireAuth();
  const token = getToken();

  const resume = document.getElementById("atsResume")?.value || "";
  const jd = document.getElementById("atsJD")?.value || "";

  try {
    const res = await fetch(
      `${BACKEND}/api/screening/ats?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jd })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("ATS error:", data);
      alert("Failed to run ATS screening.");
      return;
    }
    document.getElementById("atsResult").textContent = data.result || "";
  } catch (err) {
    console.error("ATS error:", err);
    alert("Network error.");
  }
}

// ===== BULK SCREENING (for business) =====
async function runBulk() {
  requireAuth();
  const token = getToken();

  const resumes = document.getElementById("bulkResumes")?.value || "";
  const jd = document.getElementById("bulkJD")?.value || "";

  try {
    const res = await fetch(
      `${BACKEND}/api/screening/bulk?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumes, jd })
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("Bulk error:", data);
      alert("Failed bulk screening.");
      return;
    }
    document.getElementById("bulkResult").textContent = JSON.stringify(
      data.candidates || [],
      null,
      2
    );
  } catch (err) {
    console.error("Bulk error:", err);
    alert("Network error.");
  }
}

// ===== LOGOUT =====
function logout() {
  clearToken();
  window.location.href = "/login.html";
}
