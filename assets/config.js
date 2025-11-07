// ====== Configuration for FastAPI backend ======
const DIRECT_OPENAI = false; // keep false — FastAPI will call OpenAI safely
const BACKEND_BASE_URL = "https://careerloopaibackend.onrender.com"; // change if you host online

const ENDPOINTS = {
  generateResume: `${BACKEND_BASE_URL}/api/builder/generate`,
  screening: `${BACKEND_BASE_URL}/api/screening/score`,
  contact: `${BACKEND_BASE_URL}/api/contact`,
  stats: `${BACKEND_BASE_URL}/api/stats`,
  assistantProxy: `${BACKEND_BASE_URL}/api/assistant`
};

const OPENAI_MODEL = "gpt-4o-mini";
