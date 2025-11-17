const BACKEND = "https://careerloopaibackend.onrender.com";

const $ = (id) => document.getElementById(id);

function toast(msg){
  const t = $('toast');
  t.innerText = msg;
  t.style.display='block';
  setTimeout(()=>t.style.display='none',3000);
}

/* ------------------ LOGIN ------------------ */
$('loginBtn').addEventListener('click', ()=>{
  const email = $('loginEmail').value.trim();
  if(!email || !email.includes('@')) return toast("Enter valid email");
  localStorage.setItem("userEmail", email);
  $('userEmailLabel').innerText = email;
  $('login').classList.remove('page-active');
  $('mainWrapper').classList.remove('hidden');
});

/* LOGOUT */
$('logoutBtn').addEventListener('click', ()=>{
  localStorage.removeItem("userEmail");
  location.reload();
});

/* ROUTING */
function route(){
  const hash = location.hash || '#home';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('page-active'));
  const el = document.querySelector(hash);
  if(el) el.classList.add('page-active');

  document.querySelectorAll('[data-route]').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href')===hash);
  });
}
window.addEventListener('hashchange',route);

/* SHOW PRIVACY POLICY TEMP */
function showPolicy(){ toast("Policy page coming soon"); }

/* ----------------- RESUME BUILDER ----------------- */
$('genResume').addEventListener('click', async ()=>{

  if(!$('b_consent').checked) return toast("Consent required");

  const payload = {
    name:$('b_name').value,
    email:$('b_email').value || localStorage.getItem("userEmail"),
    target_role:$('b_role').value,
    experience_level:$('b_exp').value,
    achievements:$('b_achieve').value,
    skills:$('b_skills').value,
    projects:$('b_proj').value,
    education:$('b_edu').value,
    certifications:$('b_cert').value,
    extras:$('b_extra').value,
    consent:true
  };

  $('resumePreview').innerHTML = "Generating...";

  try{
    const res = await fetch(`${BACKEND}/api/builder/generate`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const j = await res.json();
    if(j.html) $('resumePreview').innerHTML = j.html;
    else $('resumePreview').innerHTML = "Error.";
  }catch{
    toast("Server error");
  }
});

/* SAVE */
$('saveResumeBtn').addEventListener('click', ()=>{
  toast("Resume saved in DB automatically when generated.");
});

/* PDF */
$('downloadPdfBtn').addEventListener('click', ()=>{
  const w = window.open();
  w.document.write('<html><body>'+$('resumePreview').innerHTML+'</body></html>');
  w.print();
});

/* ----------------- SCREENING (single) ----------------- */
$('screenSingleBtn').addEventListener('click', async()=>{
  const jd = $('singleJD').value.trim();
  const resume = $('singleResume').value.trim();
  if(!jd || !resume) return toast("Enter JD + Resume");
  $('singleScreenResult').classList.remove('hidden');
  $('singleScreenResult').innerText = "Processing...";

  try{
    const r = await fetch(`${BACKEND}/api/screening/score`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({resume_text:resume, job_description:jd})
    });
    const j = await r.json();
    $('singleScreenResult').innerText = JSON.stringify(j,null,2);
  }catch{
    toast("Error");
  }
});

/* ----------------- BULK ----------------- */
$('screenBulkBtn').addEventListener('click', async()=>{
  const jd = $('bulkJD').value.trim();
  const files = $('bulkFiles').files;
  if(!jd || !files.length) return toast("Add JD & files");

  const items = [];

  for(const file of files){
    const fd = new FormData();
    fd.append("file", file);
    const upload = await fetch(`${BACKEND}/api/upload/resume`,{method:'POST',body:fd});
    const up = await upload.json();
    items.push({resume_text:up.text_snippet,resume_id:up.id});
  }

  $('bulkScreenResult').classList.remove('hidden');
  $('bulkScreenResult').innerText = "Analyzing...";

  const res = await fetch(`${BACKEND}/api/screening/bulk`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({job_description:jd,items})
  });
  const j = await res.json();
  $('bulkScreenResult').innerText = JSON.stringify(j,null,2);
});

/* ----------------- ADMIN ----------------- */
$('loadAdminStats').addEventListener('click', async()=>{
  const res = await fetch(`${BACKEND}/api/admin/overview`,{
    headers:{'X-Admin-Key':'SUPER_SIMPLE_ADMIN_KEY'}
  });
  const j = await res.json();
  $('adminStats').innerText = JSON.stringify(j,null,2);
});

/* Initialize */
route();

/* ----------------- ANIMATED WAVE BACKGROUND ----------------- */

const canvas = document.getElementById("bgWaveCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let offset = 0;

function animateWave(){
  offset += 0.015;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=0;i<3;i++){
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2 + i*20);

    for(let x=0; x<canvas.width; x++){
      const y = Math.sin(x*0.006 + offset + i)*12;
      ctx.lineTo(x, canvas.height/2 + y + i*18);
    }

    ctx.strokeStyle = i===0 ? "#6c5ce7aa" : i===1 ? "#ff9ff3aa" : "#74b9ffaa";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  requestAnimationFrame(animateWave);
}
animateWave();
