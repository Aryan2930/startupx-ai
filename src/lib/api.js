/**
 * lib/api.js
 * All AI-generation logic lives here, separate from UI components.
 * Calls a local Ollama server (https://ollama.com) through the Vite dev
 * proxy at /ollama (see vite.config.js) — no API key, no cost, runs fully
 * offline once the model is downloaded. Requires `ollama serve` running
 * locally and the model pulled (see README).
 */

const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3.1";
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 600;

export const SYS_BASE =
  "You are a world-class startup analyst combining the rigor of a VC investment committee, a market research firm, and a CFO. Respond ONLY with strict, valid, minified JSON matching the requested shape exactly. No markdown, no prose, no code fences, no explanation before or after. Keep every string concise (a phrase or one short sentence) so the whole response fits comfortably in 1000 tokens. Ground numbers in realistic startup benchmarks for the given idea, industry and country. ALL monetary figures anywhere in the output MUST be in Indian Rupees using the ₹ symbol and Indian numbering conventions (e.g. ₹8L for 8 lakh, ₹2.4Cr for 2.4 crore, ₹450Cr for large TAM figures) — never use $ or western thousand/million/billion notation, even if the idea targets a non-Indian market, since the report is being read in INR.";

export function buildContext(idea) {
  return `Startup idea: "${idea.idea}". Industry: ${idea.industry || "unspecified"}. Country/market: ${idea.country || "India"}. Target audience: ${idea.audience || "unspecified"}. Business model: ${idea.model || "unspecified"}. Budget: ${idea.budget || "unspecified"}. Timeline: ${idea.timeline || "unspecified"}. Team size: ${idea.team || "unspecified"}. Stage: ${idea.stage || "idea stage"}. All monetary values in the response must be in INR (₹, lakh/crore notation).`;
}

export const CALL_DEFS = [
  {
    key: "overviewMarket",
    label: "Scoring the idea and sizing the market",
    prompt: (ctx) =>
      `${ctx}\nReturn JSON: {"executiveSummary":"2 sentences","startupScore":0-100,"unicornPotential":0-100,"successProbability":0-100,"riskScore":0-100,"marketReadiness":"Low/Medium/High","aiConfidence":0-100,"investmentAttractiveness":"Low/Medium/High","market":{"tam":"₹ figure with short label e.g. ₹450Cr","sam":"₹ figure","som":"₹ figure","cagr":"x%","trends":["3 short trend phrases"],"growthChart":[{"year":"Y1..Y5 label","value":number_in_INR_crore}]}}`,
  },
  {
    key: "customersCompetitors",
    label: "Building customer personas and mapping competitors",
    prompt: (ctx) =>
      `${ctx}\nReturn JSON: {"personas":[{"name":"persona name","age":"range","occupation":"","painPoints":["2 short items"],"goals":["2 short items"]}] (2 personas),"competitors":[{"name":"","funding":"₹ figure or Bootstrapped","strengths":"one short phrase","weaknesses":"one short phrase","marketShare":number 0-100}] (4 competitors),"swot":{"strengths":["2 items"],"weaknesses":["2 items"],"opportunities":["2 items"],"threats":["2 items"]}}`,
  },
  {
    key: "revenueFinancials",
    label: "Modeling revenue, financials and funding",
    prompt: (ctx) =>
      `${ctx}\nReturn JSON: {"revenueModels":[{"model":"name","estimate":"₹/yr short figure e.g. ₹1.2Cr"}] (4 models),"financials":{"forecastChart":[{"year":"Y1..Y5","revenue":number_in_INR_lakh,"expenses":number_in_INR_lakh,"profit":number_in_INR_lakh}],"burnRate":"₹/mo figure","runwayMonths":number,"breakEvenMonth":number,"cac":"₹ figure","ltv":"₹ figure"},"funding":{"recommendedRound":"e.g. Pre-seed","estimatedValuation":"₹ figure","investorTypes":["3 short items"]}}`,
  },
  {
    key: "roadmapTechBrand",
    label: "Planning the roadmap, stack and brand identity",
    prompt: (ctx) =>
      `${ctx}\nReturn JSON: {"roadmap":[{"phase":"MVP/V1/Scale/etc","timeline":"e.g. Month 1-3","milestone":"one short phrase"}] (4 phases),"techStack":{"frontend":"","backend":"","database":"","cloud":"","ai":""},"branding":{"names":["3 candidate names"],"tagline":"one short tagline","colors":["2 hex codes"],"mission":"one short sentence"}}`,
  },
  {
    key: "marketingRisks",
    label: "Drafting go-to-market plan and risk assessment",
    prompt: (ctx) =>
      `${ctx}\nReturn JSON: {"marketing":{"channels":["4 short channel names"],"strategy":"one short sentence go-to-market strategy"},"risks":[{"risk":"short name","severity":"Low/Medium/High","mitigation":"one short sentence"}] (4 risks)}`,
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonFromText(text) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const jsonSlice = firstBrace >= 0 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
  return JSON.parse(jsonSlice);
}

/**
 * Single call to your local Ollama server, expecting a JSON-only response
 * from the model. Ollama's "format": "json" mode forces syntactically valid
 * JSON at the grammar level (it doesn't guarantee it matches our schema, but
 * combined with parseJsonFromText below it's reliable in practice).
 * Throws a descriptive Error if Ollama isn't reachable or a request fails.
 */
async function callClaudeOnce(systemPrompt, userPrompt) {
  let response;
  try {
    response = await fetch("/ollama/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        format: "json",
        stream: false,
        options: { num_predict: 1200, temperature: 0.7 },
      }),
    });
  } catch (networkErr) {
    const err = new Error(
      `Couldn't reach Ollama at localhost:11434. Make sure it's installed and running — try 'ollama serve' in a terminal.`
    );
    err.code = "OLLAMA_UNREACHABLE";
    throw err;
  }

  if (!response.ok) {
    let message = `Ollama request failed with status ${response.status}`;
    try {
      const errBody = await response.json();
      message = errBody?.error || message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    if (response.status === 404) {
      message = `Model "${OLLAMA_MODEL}" isn't pulled yet — run 'ollama pull ${OLLAMA_MODEL}' in a terminal.`;
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return parseJsonFromText(data.response || "");
}

/**
 * Retries transient failures (network errors, 429 rate limits, 5xx server errors)
 * with exponential backoff. Does not retry on malformed JSON or 4xx client
 * errors (other than 429), since those won't resolve on their own.
 */
export async function callClaude(systemPrompt, userPrompt) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callClaudeOnce(systemPrompt, userPrompt);
    } catch (err) {
      lastError = err;
      const isRetryable = err.code !== "OLLAMA_UNREACHABLE" && (!err.status || err.status === 429 || err.status >= 500);
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isRetryable || isLastAttempt) throw err;
      await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
    }
  }
  throw lastError;
}

/**
 * Runs every section's prompt in parallel and merges the successful results.
 * A failure in one section doesn't block the others — onSectionDone fires as
 * each section resolves (in whatever order they land) so the UI can show
 * live progress, and the final return tells the caller which sections (if
 * any) failed so it can surface a partial-report warning instead of nothing.
 */
export async function generateReport(idea, onSectionDone) {
  const ctx = buildContext(idea);
  const merged = {};
  const failed = [];

  const settled = await Promise.allSettled(
    CALL_DEFS.map((def) =>
      callClaude(SYS_BASE, def.prompt(ctx)).then((result) => {
        onSectionDone?.(def.key);
        return { key: def.key, result };
      })
    )
  );

  settled.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      Object.assign(merged, outcome.value.result);
    } else {
      failed.push({ key: CALL_DEFS[i].key, label: CALL_DEFS[i].label, error: outcome.reason });
    }
  });

  return { data: merged, failed };
}

/**
 * Regenerates just the given section keys (e.g. when the user clicks
 * "Regenerate" on a single report tab) instead of the whole report.
 * Runs the requested sections in parallel; throws if any of them still
 * fails after retries, so the caller can leave the existing data in place
 * and show an error instead of partially overwriting the report.
 */
export async function regenerateSections(idea, keys) {
  const ctx = buildContext(idea);
  const defs = CALL_DEFS.filter((def) => keys.includes(def.key));
  const results = await Promise.all(defs.map((def) => callClaude(SYS_BASE, def.prompt(ctx))));
  return Object.assign({}, ...results);
}
