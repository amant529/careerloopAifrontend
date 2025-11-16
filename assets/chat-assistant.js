(function () {
  const toggle = document.getElementById("clai-toggle");
  const panel = document.getElementById("clai-panel");
  const form = document.getElementById("clai-form");
  const input = document.getElementById("clai-input");
  const msgs = document.getElementById("clai-messages");
  const voiceBtn = document.getElementById("clai-voice");
  const resumeBtn = document.getElementById("clai-file");
  const resumeInput = document.getElementById("clai-file-input");
  const suggestionsBox = document.getElementById("clai-suggestions");

  const API_BASE = "https://careerloopaibackend.onrender.com";
  const ASSIST_API = `${API_BASE}/api/assistant`;
  const HISTORY_API = `${API_BASE}/api/chat/history`;
  const LOCAL_HISTORY_KEY = "careerloop_chat_history";
  const EMAIL_KEY = "careerloop_user_email";

  let userEmail = localStorage.getItem(EMAIL_KEY) || null;

  // Ask for email once (for cloud sync)
  if (!userEmail) {
    const maybe = prompt("Enter your email to save chat history (optional):");
    if (maybe && maybe.trim()) {
      userEmail = maybe.trim();
      localStorage.setItem(EMAIL_KEY, userEmail);
    }
  }

  // Load local history immediately
  loadLocalHistory();

  // Then try to sync from cloud if email available
  if (userEmail) {
    syncFromCloud(userEmail);
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("clai-open");
    if (panel.classList.contains("clai-open")) scrollToBottom();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    addMsg("me", q);
    input.value = "";
    showTyping();
    saveLocalHistory();
    const reply = await callAssistant(q);
    animateBotReply(reply);
    saveLocalHistory();
    buildSuggestions(reply);
  });

  // ========== BASIC MESSAGE UTILS ==========

  function addMsg(role, text) {
    const row = document.createElement("div");
    row.className = `clai-msg ${role === "me" ? "me" : "bot"}`;
    row.innerHTML = `<div class="clai-bubble">${text}</div>`;
    msgs.appendChild(row);
    scrollToBottom();
  }

  function showTyping() {
    addMsg("bot", "Typing...");
  }

  async function callAssistant(message) {
    try {
      const body = { message };
      if (userEmail) body.email = userEmail;

      const res = await fetch(ASSIST_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      return json.reply || "No response.";
    } catch (e) {
      return "⚠ Unable to connect to AI right now.";
    }
  }

  function animateBotReply(text) {
    const bubbles = msgs.querySelectorAll(".clai-msg.bot .clai-bubble");
    const bubble = bubbles[bubbles.length - 1];
    bubble.textContent = "";
    let i = 0;
    (function type() {
      if (i < text.length) {
        bubble.textContent += text.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(type, 18);
      }
    })();
  }

  function scrollToBottom() {
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ========== SMART SUGGESTIONS ==========

  function buildSuggestions(lastReply) {
    if (!suggestionsBox) return;
    suggestionsBox.innerHTML = "";

    const suggestions = [];
    if (/keyword|ATS|match/i.test(lastReply)) {
      suggestions.push("Generate ATS keywords for my resume");
    }
    if (/improve|rewrite|optimi[sz]e/i.test(lastReply)) {
      suggestions.push("Improve my resume more");
    }
    if (lastReply.length > 150) {
      suggestions.push("Summarize this into 3 lines");
    }
    suggestions.push("Give me an example resume for my role");
    suggestions.push("How do I increase interview chances?");

    suggestions.forEach((txt) => {
      const b = document.createElement("button");
      b.textContent = txt;
      b.addEventListener("click", () => {
        input.value = txt;
        form.dispatchEvent(new Event("submit"));
      });
      suggestionsBox.appendChild(b);
    });
  }

  // ========== LOCAL HISTORY ==========

  function saveLocalHistory() {
    localStorage.setItem(LOCAL_HISTORY_KEY, msgs.innerHTML);
  }

  function loadLocalHistory() {
    const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (saved) {
      msgs.innerHTML = saved;
      scrollToBottom();
    }
  }

  window.clearChatHistory = function () {
    if (confirm("Clear chat history on this device?")) {
      localStorage.removeItem(LOCAL_HISTORY_KEY);
      msgs.innerHTML = "";
      if (suggestionsBox) suggestionsBox.innerHTML = "";
    }
  };

  // ========== CLOUD SYNC (PER EMAIL) ==========

  async function syncFromCloud(email) {
    try {
      const res = await fetch(`${HISTORY_API}?email=${encodeURIComponent(email)}`);
      if (!res.ok) return;
      const list = await res.json(); // [{role,content,created_at},...]

      if (!Array.isArray(list) || list.length === 0) return;

      msgs.innerHTML = "";
      list.forEach((m) => {
        addMsg(m.role === "user" ? "me" : "bot", m.content);
      });
      saveLocalHistory();
      scrollToBottom();
    } catch (e) {
      // fail silently, device just uses local history
    }
  }

  // ========== VOICE INPUT ==========

  if (voiceBtn && "webkitSpeechRecognition" in window) {
    const SR = new webkitSpeechRecognition();
    SR.lang = "en-US";
    SR.continuous = false;

    voiceBtn.addEventListener("click", () => {
      SR.start();
      voiceBtn.textContent = "🎙";
    });

    SR.onresult = (e) => {
      input.value = e.results[0][0].transcript;
      voiceBtn.textContent = "🎤";
    };

    SR.onerror = () => {
      voiceBtn.textContent = "🎤";
    };
  }

  // ========== RESUME FILE UPLOAD → AI IMPROVEMENT ==========

  if (resumeBtn && resumeInput) {
    resumeBtn.addEventListener("click", () => resumeInput.click());
    resumeInput.addEventListener("change", async () => {
      const file = resumeInput.files[0];
      if (!file) return;

      const text = await file.text();
      addMsg("me", `📄 Uploaded resume: ${file.name}`);
      showTyping();
      const reply = await callAssistant(
        "Improve this resume, fix grammar, and make it ATS-friendly (do not lie):\n\n" + text
      );
      animateBotReply(reply);
      saveLocalHistory();
      buildSuggestions(reply);
    });
  }

  // ========== QUICK ACTIONS (still available) ==========

  const QUICK_PROMPTS = {
    improve: "Improve this resume content:\n\n",
    keywords: "Extract missing ATS-relevant keywords from this resume:\n\n",
    tailor: "Tailor this resume content for the following job description. Resume first, then JD:\n\n",
    summary: "Write a short powerful 3-sentence professional summary based on this resume:\n\n",
  };

  window.claiQuick = async function (type) {
    const resumeText = prompt("Paste your resume text:");
    if (!resumeText) return;
    addMsg("me", `[${type.toUpperCase()}] request sent`);
    showTyping();
    const prompt = QUICK_PROMPTS[type] || "";
    const reply = await callAssistant(prompt + resumeText);
    animateBotReply(reply);
    saveLocalHistory();
    buildSuggestions(reply);
  };
})();
