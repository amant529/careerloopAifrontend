// Floating AI Assistant (uses backend proxy or direct OpenAI per config)
(function(){
  const toggle = document.getElementById("clai-toggle");
  const panel = document.getElementById("clai-panel");
  const form = document.getElementById("clai-form");
  const input = document.getElementById("clai-input");
  const msgs = document.getElementById("clai-messages");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => { panel.classList.toggle("hidden"); input?.focus(); });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    pushMsg("me", q);
    input.value = "";
    pushMsg("bot", "Thinking...");
    try{
      const ans = await askAI(q);
      replaceLastBot(ans);
    }catch(err){
      replaceLastBot("I hit a snag. Check config or try again.");
    }
  });

  function pushMsg(side, text){
    const div = document.createElement("div");
    div.className = `clai-msg ${side}`;
    const bubble = document.createElement("div");
    bubble.className = "clai-bubble";
    bubble.textContent = text;
    div.appendChild(bubble);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function replaceLastBot(text){
    const nodes = msgs.querySelectorAll(".clai-msg");
    for (let i = nodes.length-1; i>=0; i--){
      if (!nodes[i].classList.contains("me")){
        nodes[i].querySelector(".clai-bubble").textContent = text;
        msgs.scrollTop = msgs.scrollHeight;
        return;
      }
    }
    pushMsg("bot", text);
  }

  async function askAI(q){
    // Preferred: backend proxy (keeps your key safe)
    if (!DIRECT_OPENAI && ENDPOINTS.assistantProxy){
      const r = await fetch(ENDPOINTS.assistantProxy, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ message: q })
      });
      if (r.ok){ const j = await r.json(); return j.reply || "(No reply)"; }
      throw new Error("Proxy failed");
    }
    // Direct OpenAI (demo only)
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("YOUR_OPENAI_SECRET_KEY_HERE")){
      throw new Error("Missing OPENAI_API_KEY in assets/config.js");
    }
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role:"system", content:"You are CareerloopAI’s assistant. Help with resume writing, keyword targeting, screening criteria, and troubleshooting. Be concise and actionable."},
          { role:"user", content:q }
        ],
        temperature: 0.5
      })
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    return j.choices?.[0]?.message?.content?.trim() || "(No reply)";
  }
})();
