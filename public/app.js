// ===========================
// Careerloop AI – Frontend Core JS
// ===========================

// Backend URL (still used for resume + screening calls)
const BACKEND = "https://careerloopaibackend.onrender.com";

// ---------------------------
// TOKEN + ROLE HELPERS
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

// Page protection
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

    // Fake token generated for temporary login
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
    const token = getToken();

    const name = document.getElementById("rName")?.value || "";
    const title = document.getElementById("rTitle")?.value || "";
    const experience = document.getElementById("rExp")?.value || "";
    const skills = document.getElementById("rSkills")?.value || "";
    const achievements = document.getElementById("rAch")?.value || "";
    const templateId = document.getElementById("rTemplate")?.value || "classic-pro";

    try {
        const res = await fetch(`${BACKEND}/api/resume/generate?token=${encodeURIComponent(token)}`, {
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
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Failed to generate resume.");
            console.error(data);
            return;
        }

        document.getElementById("resumeOutput").textContent = data.resume || "";
    } catch (err) {
        console.error("Resume error:", err);
        alert("Network error while generating resume.");
    }
}

// ---------------------------
// ATS SCREENING
// ---------------------------

async function runATS() {
    requireAuth();
    const token = getToken();

    const resume = document.getElementById("atsResume")?.value || "";
    const jd = document.getElementById("atsJD")?.value || "";

    try {
        const res = await fetch(`${BACKEND}/api/screening/ats?token=${encodeURIComponent(token)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume, jd })
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Failed to run ATS screening.");
            console.error(data);
            return;
        }

        document.getElementById("atsResult").textContent = data.result || "";
    } catch (err) {
        console.error("ATS error:", err);
        alert("Network error while running ATS.");
    }
}

// ---------------------------
// BULK SCREENING
// ---------------------------

async function runBulk() {
    requireAuth();
    const token = getToken();

    const resumes = document.getElementById("bulkResumes")?.value || "";
    const jd = document.getElementById("bulkJD")?.value || "";

    try {
        const res = await fetch(`${BACKEND}/api/screening/bulk?token=${encodeURIComponent(token)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumes, jd })
        });

        const data = await res.json();

        if (!res.ok) {
            alert("Failed bulk screening.");
            console.error(data);
            return;
        }

        document.getElementById("bulkResult").textContent =
            JSON.stringify(data.candidates || [], null, 2);
    } catch (err) {
        console.error("Bulk error:", err);
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
