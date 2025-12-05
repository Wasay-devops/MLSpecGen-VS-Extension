import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";
import FeedbackService from "./feedbackService.js";

dotenv.config();

const unseenFile = "tensorflow_top10_unseen.csv";
const researchPaperPath = "rcontext.txt";
const actionableExamplesPath = "actionable_examples.txt";
const pycontractDocPath1 = "pycontracts_doc.txt";
const pycontractDocPath2 = "pycontracts_deep.txt";
const embeddedExamplesPath = "tensorembedded_examples.json";

const TOP_K = 5;
// Embeddings: defaults to local Ollama. If you aren't running Ollama, switch to OpenAI in getEmbedding().
const EMBED_MODEL = "nomic-embed-text";
const CHAT_MODEL = "gpt-4o";

// === Output directory ===
const OUTPUT_DIR = process.env.OUTPUT_DIR || "tensor_rag_outputs";
async function ensureOutputDir() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
}

// Final CSV path inside the output folder
const outputCSVPath = path.join(OUTPUT_DIR, "tensor_gpttop10_final2.csv");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- Output CSV ----------
const csvWriter = createObjectCsvWriter({
  path: outputCSVPath,
  header: [
    { id: "postURL", title: "SO Post URL" },
    { id: "mlApiName", title: "ML API Name" },
    { id: "level1", title: "Level 1 (Central Contract Category)" },
    { id: "level2", title: "Level 2" },
    { id: "level3", title: "Level 3 (Hybrid Patterns)" },
    { id: "leafContractCategory", title: "Leaf Contract Category" },
    { id: "rootCause", title: "Root Cause" },
    { id: "effect", title: "Effect" },
    { id: "mlLibrary", title: "ML Library" },
    { id: "contractViolationLocation", title: "Contract Violation Location" },
    { id: "detectionTechnique", title: "Detection Technique" },
    { id: "reasonsForNotLabeling", title: "Reasons for not labelling" },
    { id: "reasonsForLabeling", title: "Reasons for labeling" },
    { id: "nlpContract", title: "NLP Contract (Description)" },
    { id: "specContract", title: "Specification Contract (PyContract)" }, // only @contract snippet(s)
    { id: "insight", title: "Actionable Insight" }
  ]
});

// ---------- Helpers ----------
function cosineSimilarity(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = x => Math.sqrt(x.reduce((s, v) => s + v * v, 0));
  return dot / (norm(a) * norm(b));
}

function extractPostId(url) {
  const m = url?.match?.(/questions\/(\d+)/);
  return m ? m[1] : `post_${Math.random().toString(36).slice(2, 8)}`;
}

function extractLabel(response, field, singleWord = false) {
  const regex = new RegExp(field + ":[ \\t]*(.+)", "i");
  const match = response.match(regex);
  if (!match) return "";
  const full = match[1].trim();
  return singleWord ? full.split(/,|;|\/| and /)[0].trim() : full;
}

// HTML → Markdown with fenced code blocks
function htmlToMarkdown(html) {
  let s = html || "";
  s = s.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, (_m, code) =>
    `\n\`\`\`python\n${code
      .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}\n\`\`\`\n`);
  s = s.replace(/<code>(.*?)<\/code>/gi, (_m, code) =>
    "`" + code.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&") + "`");
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_m, href, text) => `[${text}](${href})`);
  s = s.replace(/<img [^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*\/?>/gi, (_m, alt, src) => `![${alt}](${src})`);
  s = s.replace(/<p>/gi, "\n").replace(/<\/p>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
       .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

// -------- Robust code extraction (BUGGY/FIXED + NLP/Insight) --------
function extractBothCodes(content) {
  const tag = (name) => {
    const r = new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, "i").exec(content);
    return r ? r[1].trim() : "";
  };
  const buggyTag = tag("BUGGY_CODE");
  const fixedTag = tag("FIXED_CODE");
  const nlp = tag("NLP_CONTRACT") || (content.match(/NLP Contract:\s*-\s*([\s\S]*?)\n(?:Actionable Insight:|$)/i)?.[1] || "Not found").trim();
  const insight = tag("ACTIONABLE_INSIGHT") || (content.match(/Actionable Insight:\s*-\s*([\s\S]*)/i)?.[1] || "Not found").trim();

  const fenced = (blk) => {
    if (!blk) return "";
    const mLang = /```python([\s\S]*?)```/i.exec(blk);
    if (mLang) return mLang[1].trim();
    const mAny = /```([\s\S]*?)```/i.exec(blk);
    return mAny ? mAny[1].trim() : blk.trim();
  };

  let buggy = fenced(buggyTag);
  let fixed = fenced(fixedTag);

  // Fallback: first two fenced blocks in whole response if tags absent
  if (!buggy || !fixed) {
    const blocks = [...content.matchAll(/```(?:python)?([\s\S]*?)```/gi)].map(m => m[1].trim());
    buggy ||= blocks[0] || "";
    fixed ||= blocks[1] || "";
  }

  return { buggy, fixed, nlpContract: nlp, insight };
}

// -------- Extract ONLY @contract / new_contract snippets (robust) --------
function extractContractOnly(pyCode = "") {
  if (!pyCode || !pyCode.trim()) return "";

  const lines = pyCode.split(/\r?\n/);
  const blocks = [];

  // Capture helper new_contract(...) calls (as plain statements)
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*new_contract\s*\(/.test(lines[i])) {
      let start = i;
      let paren = (lines[i].match(/\(/g) || []).length - (lines[i].match(/\)/g) || []).length;
      i++;
      while (i < lines.length && paren > 0) {
        paren += (lines[i].match(/\(/g) || []).length - (lines[i].match(/\)/g) || []).length;
        i++;
      }
      blocks.push(lines.slice(start, i).join("\n").trim());
    }
  }

  // Capture any function where the decorator stack includes @contract (even if not the topmost decorator).
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*def\s+\w+\s*\(.*$/.test(lines[i])) continue;

    // Move upward to include contiguous decorator/comment/blank region
    let k = i - 1;
    while (k >= 0 && (/^\s*@/.test(lines[k]) || /^\s*(#.*)?$/.test(lines[k]) || /^\s*\)/.test(lines[k]) || /^\s*\(.*$/.test(lines[k]))) {
      k--;
    }
    k++; // first line of decorator region (or the def itself if none)

    // Check if any line in [k, i) contains @contract (with or without module prefix)
    let hasContract = false;
    for (let t = k; t < i; t++) {
      if (/^\s*@(?:\w+\.)?contract\b/.test(lines[t])) { hasContract = true; break; }
    }
    if (!hasContract) continue;

    // From def line, capture function body (indent > def indent)
    const defLine = lines[i];
    const indentMatch = defLine.match(/^(\s*)def/);
    const defIndent = indentMatch ? indentMatch[1] : "";
    let j = i + 1;
    while (
      j < lines.length &&
      (lines[j].trim() === "" || lines[j].startsWith(defIndent + " ") || lines[j].startsWith(defIndent + "\t"))
    ) {
      j++;
    }

    blocks.push(lines.slice(k, j).join("\n").trim());
    i = j - 1; // skip past this function
  }

  return blocks.join("\n\n");
}

// ---------- Embeddings ----------
async function getEmbedding(text) {
  // A) Local Ollama (default)
  const resp = await axios.post("http://127.0.0.1:11434/api/embeddings", {
    model: EMBED_MODEL,
    input: text
  }, { timeout: 10000 });
  const body = resp.data;
  if (Array.isArray(body?.data) && body.data[0]?.embedding) return body.data[0].embedding;
  if (Array.isArray(body?.embedding)) return body.embedding;
  throw new Error("Unexpected embeddings response shape from Ollama.");

  // B) OpenAI (switch to this if not using Ollama — and re-embed your corpus):
  // const e = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  // return e.data[0].embedding;
}

// ---------- Context ----------
async function readContextFiles() {
  const [researchPaper, actionableExamples, py1, py2, embeddedExamples] = await Promise.all([
    fs.promises.readFile(researchPaperPath, "utf-8"),
    fs.promises.readFile(actionableExamplesPath, "utf-8"),
    fs.promises.readFile(pycontractDocPath1, "utf-8"),
    fs.promises.readFile(pycontractDocPath2, "utf-8"),
    fs.promises.readFile(embeddedExamplesPath, "utf-8")
  ]);
  return {
    researchPaper,
    actionableExamples,
    pycontractDoc: py1 + "\n\n" + py2,
    embeddedExamples: JSON.parse(embeddedExamples)
  };
}

// ---------- CSV ingestion ----------
async function readUnseenCSV() {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(unseenFile)
      .pipe(csvParser())
      .on("data", row => {
        const postURL = row["SO Post URL"] || row["so_post_url"] || row["url"] || "";
        const titleRaw = row["Title"] || row["title"] || "";
        const qRaw = row["Question"] || row["question"] || row["question_html"] || "";
        const aRaw = row["Answer"] || row["answer"] || row["answer_html"] || "";

        const title = (titleRaw || "").toString();
        const question = htmlToMarkdown((qRaw || "").toString());
        const answer = htmlToMarkdown((aRaw || "").toString());

        if (postURL) rows.push({ postURL, title, question, answer });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

// ---------- Prompts ----------
function buildLabelingPrompt(researchPaper, actionableExamples, examples, post) {
  return `
You are an expert at labeling Stack Overflow posts according to a predefined taxonomy described in the research paper below.

--- RESEARCH PAPER ---
${researchPaper}

--- ACTIONABLE INSIGHT EXAMPLES ---
${actionableExamples}

--- LABELED POST EXAMPLES ---
${examples.map((ex, i) => `
Example ${i + 1}:
Post URL: ${ex.postURL}
Question: ${ex.question}
Answer: ${ex.answer}
Labels:
  - Level 1: ${ex.label.level1}
  - Level 2: ${ex.label.level2}
  - Level 3: ${ex.label.level3}
  - Leaf Contract Category: ${ex.label.leafContractCategory}
  - Root Cause: ${ex.label.rootCause}
  - Effect: ${ex.label.effect}
  - Contract Violation Location: ${ex.label.contractViolationLocation}
  - Detection Technique: ${ex.label.detectionTechnique}
  - Reasons for not labelling: ${ex.label.reasonsForNotLabeling}
  - Reasons for labeling: ${ex.label.reasonsForLabeling}
`).join("\n")}

--- NEW POST TO LABEL---
URL: ${post.postURL}
Title: ${post.title}
Question: ${post.question}
Answer: ${post.answer}

Please carefully consider the guidelines below when assigning labels:

Guidelines:
- Level 1 (Central Contract Category): 
    - SAM: Single API Method — Contracts involving a single API method, typically focusing on preconditions and postconditions.
    - AMO: API Method Order — Contracts that specify the required order of API method calls.
    - Hybrid: Combination of behavioral (SAM) and temporal (AMO) contracts.
- Level 2: 
    - DT: Data Type — Contracts related to the expected data types of API arguments.
    - BET: Boolean Expression Type — Contracts involving boolean expressions or conditions on API arguments.
    - G: Always — Temporal contracts that must always hold during execution.
    - F: Eventually — Temporal contracts that must hold at some point during execution.
    - SAI — Use this label for contracts involving interdependence between behavioral (SAM) and temporal (AMO) aspects.
    - SL: Selection — Contracts that involve selecting among multiple valid API usage patterns.
- Level 3 (Hybrid Patterns): 
    - PT: Primitive Type — Contracts expecting primitive data types (e.g., int, float).
    - BIT: Built-in Type — Contracts expecting built-in data structures (e.g., list, dict).
    - RT: Reference Type — Contracts expecting references to objects or classes.
    - MT: ML Type — Contracts expecting machine learning-specific types (e.g., tensors).
    - IC-1: Intra-argument Contract — Contracts involving conditions within a single API argument.
    - IC-2: Inter-argument Contract — Contracts involving conditions between multiple API arguments.
- Root Cause: Unacceptable Input Type, Unacceptable Input Value, Missing Options, Missing Input Value/Type Dependency, Missing Input value-Method order Dependency, Missing Required Method Order, Missing Required State-specific Method Order
- Effect: Crash, IF, BP, MOB, Unknown
- ML Library: TensorFlow, Keras, PyTorch, Scikit-learn
- Contract Violation Location: Model Construction, Train, Model Evaluation, Data Preprocessing, Prediction, Load, Model Initialization
- Detection Technique: Static, Runtime Checking
- Reasons for not labelling: NA, NI, IM
- Reasons for labeling: Provide a clear explanation

For each label field, please follow these rules:
- Level 1: Choose only one best-fitting label.
- Level 2: Choose only one best-fitting label.
- Level 3: You may return multiple labels if appropriate. Separate them with commas.
- Leaf Contract Category: Should match Level 3 — one or more values.

If you're uncertain, pick the single closest match based on the guidelines for Level 1 and Level 2.

Respond in this format:

Level 1: [your choice]  
Level 2: [your choice]  
Level 3: [your choice]  
Leaf Contract Category: [your choice]  
Root Cause: [your choice]  
Effect: [your choice]  
Contract Violation Location: [your choice]  
Detection Technique: [your choice]  
Reasons for not labelling: [your choice]  
Reasons for labeling: [your explanation].
`;
}

function buildPyPrompt(ctx, post, label) {
  return `
You are an expert Python engineer and ML contract verifier.

--- RESEARCH CONTEXT ---
${ctx.researchPaper}

--- PYCONTRACT DOCUMENTATION ---
${ctx.pycontractDoc}

--- ACTIONABLE INSIGHT EXAMPLES ---
${ctx.actionableExamples}

--- STACK OVERFLOW POST ---
URL: ${post.postURL}
Title: ${post.title}
Question:
${post.question}

Answer:
${post.answer}

--- CLASSIFICATION LABELS FOR THIS POST ---
Level 1: ${label.level1}
Level 2: ${label.level2}
Level 3: ${label.level3}
Root Cause: ${label.rootCause}
Effect: ${label.effect}
Contract Violation Location: ${label.contractViolationLocation}
Detection Technique: ${label.detectionTechnique}
Reasons for Labeling: ${label.reasonsForLabeling}

--- TARGET ENVIRONMENT ---
- Python: 3.10–3.11
- Contracts library: PyPI package "PyContracts" (import as: from contracts import ...), version 1.8.x
- Other libs: only those mentioned in the post; prefer CPU builds; avoid unnecessary deps

--- TASK ---
0) Replicate the question’s code verbatim when possible. Only replace APIs that are deprecated/removed or incompatible with the TARGET ENVIRONMENT. For each such change, add an inline comment:
   # [REPLACED] <old> -> <new> (reason)
   (Preserve variable names and structure; do not “improve” logic beyond reproducing the error.)
1) From the “STACK OVERFLOW POST” section, identify:
   a) the failing API call (the method that raises), and
   b) the specific precondition that would prevent that failure (infer from the accepted answer and/or traceback).
2) Complete the post’s code into a self-contained, deterministic Python module that reproduces the same failure scenario.
3) Introduce a thin wrapper function around the failing API with @contract (from 'contracts') where you encode that precondition.
   - Use @contract for types/shapes and an inline assert for stateful requirements.
   - CRITICAL - NEVER USE TENSORFLOW TYPES IN @contract:
     * NEVER write: @contract(sess='tf.compat.v1.Session') or @contract(vars='list[tf.Variable]') or @contract(model='tf.keras.Model')
     * PyContracts CANNOT parse TensorFlow types - they will cause "Unknown identifier 'tf'" errors
     * PyContracts also CANNOT parse 'object' type - it's not a valid contract type
     * SOLUTION: For functions with ONLY TensorFlow/Keras parameters, do NOT use @contract - use assert statements instead
     * SOLUTION: For functions with mixed parameters (TF + numpy), use @contract only for numpy parameters, assert for TF
   - Examples:
     * WRONG: @contract(sess='tf.compat.v1.Session', vars='list[tf.Variable]') - WILL FAIL
     * WRONG: @contract(sess='object', vars='list') - 'object' not recognized
     * WRONG: @contract with docstring :type: tf.compat.v1.Session - PyContracts tries to parse it
     * CORRECT (TF-only params): def func(sess, vars):\n    assert isinstance(sess, tf.compat.v1.Session)\n    assert isinstance(vars, list)
     * CORRECT (mixed params): @contract(data='array(float32)')\n    def func(model, data):\n        assert isinstance(model, tf.keras.Model)
     * CORRECT (numpy-only): @contract(X='array(float32)', y='array(int32)') - numpy arrays work fine
   - For TensorFlow/Keras objects: Use assert isinstance() statements, NOT @contract
   - For numpy arrays/lists: You CAN use @contract parameters like @contract(data='array(float32)')
   - Avoid @new_contract unless strictly necessary; if used, give it a name and make it return a boolean.
4) Produce TWO modules using the SAME contract(s):
   - BUGGY: reproduces the failure, but the failure is a contract violation (not a generic crash).
   - FIXED: satisfies the same contract and exits successfully.
5) In each module, include an if __name__ == "__main__": block:
   - BUGGY: demonstrate the buggy usage so the contract triggers (contract violation).
   - FIXED: demonstrate the corrected usage that passes under the same contract.
6) Constraints:
   - Deterministic: no network/downloads; use small synthetic data; set random seeds where relevant.
   - Stay within the libraries mentioned in the post; only minimal dependencies.
   - Keep function names/signatures stable (to enable automated repairs).
   - Ensure the code runs under the TARGET ENVIRONMENT above.
   - Do NOT use the "contracts" PyPI package (different project); use PyContracts (from contracts import ...).

8) Output exactly in this format (NO extra prose):

<BUGGY_CODE>
\`\`\`python
# full module that reproduces the failure as a contract violation
\`\`\`
</BUGGY_CODE>

<FIXED_CODE>
\`\`\`python
# full module that satisfies the same contract and exits successfully
\`\`\`
</FIXED_CODE>

<NLP_CONTRACT>
- Plain-English preconditions/postconditions and the exact failure the contract prevents.
</NLP_CONTRACT>

<ACTIONABLE_INSIGHT>
- 1–2 concrete actionable insights for the developers.
</ACTIONABLE_INSIGHT>

CRITICAL CONTRACT SYNTAX RULES (MUST FOLLOW - THESE ERRORS WILL CAUSE FAILURES):
1. NEVER use TensorFlow/Keras types in @contract - PyContracts CANNOT parse them:
   - WRONG: @contract(sess='tf.compat.v1.Session', vars='list[tf.Variable]', model='tf.keras.Model')
   - WRONG: @contract(sess='object', vars='list') - 'object' is also not recognized
   - WRONG: @contract with docstring :type: tf.compat.v1.Session - PyContracts tries to parse it
   - CORRECT: For TensorFlow/Keras objects, use assert isinstance() statements instead of @contract
   - CORRECT: def func(sess, vars):\n    assert isinstance(sess, tf.compat.v1.Session)\n    assert isinstance(vars, list)
   - CORRECT: For mixed params, use @contract for numpy, assert for TF: @contract(data='array(float32)')\n    def func(model, data):\n        assert isinstance(model, tf.keras.Model)
   - If you see "Unknown identifier 'tf'" error, replace @contract with assert isinstance() for TF objects

2. For numpy arrays: Use 'array(float32)', 'array(int32)', 'array(uint8)' (parentheses, not brackets)
   - WRONG: 'array[float32]' or 'array[N,M](float32)' - will cause ParseException
   - CORRECT: 'array(float32)'

3. For lists: Use 'list', 'list(str)', 'list(int32)'
   - WRONG: 'list[string]' or 'list[tf.Variable]'
   - CORRECT: 'list(str)' or 'list' (use 'object' for TF objects in lists)

4. For basic types: Use 'int32', 'float32', 'str', 'bool'
   - WRONG: 'int', 'float', 'string'
   - CORRECT: 'int32', 'float32', 'str'

5. Alternative for TensorFlow types: Use docstring type hints instead of contract parameters
   - @contract\n    def func(sess):\n        \":type sess: tf.compat.v1.Session\"\"

6. Avoid 'inst(...)' and lowercase 'callable' strings; these can break on newer PyContracts.
7. When replacing deprecated APIs, add [REPLACED] comments.
`;
}

// ---------- OpenAI ----------
async function runChatPrompt(prompt) {
  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: "You are an expert in ML contract violations and PyContracts." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  return res.choices[0].message.content;
}

// ---------- Pipeline ----------
async function classifyAndGenerate(row, context) {
  const embedInput = [row.title, row.question, row.answer].filter(Boolean).join("\n\n");
  const embedding = await getEmbedding(embedInput);

  const exDim = Array.isArray(context.embeddedExamples?.[0]?.embedding)
    ? context.embeddedExamples[0].embedding.length : null;
  if (exDim && embedding.length !== exDim) {
    console.warn(` Embedding dim mismatch for ${row.postURL}: query=${embedding.length}, examples=${exDim}. Re-embed embedded_examples.json with the SAME model.`);
  }

  const topK = context.embeddedExamples
    .map(ex => ({ ...ex, score: cosineSimilarity(embedding, ex.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const labelingPrompt = buildLabelingPrompt(context.researchPaper, context.actionableExamples, topK, row);
  const labelingResponse = await runChatPrompt(labelingPrompt);

  const labelFields = {
    level1: extractLabel(labelingResponse, "Level 1", true),
    level2: extractLabel(labelingResponse, "Level 2", true),
    level3: extractLabel(labelingResponse, "Level 3"),
    leafContractCategory: extractLabel(labelingResponse, "Leaf Contract Category") || extractLabel(labelingResponse, "Level 3"),
    rootCause: extractLabel(labelingResponse, "Root Cause"),
    effect: extractLabel(labelingResponse, "Effect"),
    contractViolationLocation: extractLabel(labelingResponse, "Contract Violation Location"),
    detectionTechnique: extractLabel(labelingResponse, "Detection Technique"),
    reasonsForNotLabeling: extractLabel(labelingResponse, "Reasons for not labelling"),
    reasonsForLabeling: extractLabel(labelingResponse, "Reasons for labeling")
  };

  const pyPrompt = buildPyPrompt(context, row, labelFields);
  const pyResponse = await runChatPrompt(pyPrompt);
  let both = extractBothCodes(pyResponse);

  const postId = extractPostId(row.postURL);

  // Run automated feedback loop if both buggy and fixed code are available
  if (both.buggy && both.fixed) {
    console.log(`  Running automated feedback loop for ${row.postURL}...`);
    try {
      const feedbackService = new FeedbackService();
      
      // Create a wrapper function for LLM feedback that matches the extension's interface
      const getLLMFeedback = async (feedbackPrompt) => {
        return await runChatPrompt(feedbackPrompt);
      };

      const feedbackResult = await feedbackService.runIterativeImprovement(
        row.question + "\n\n" + row.answer, // original code context
        both.buggy,
        both.fixed,
        labelFields, // original violation labels
        getLLMFeedback,
        2 // max iterations
      );

      if (feedbackResult.success && feedbackResult.finalBuggyCode && feedbackResult.finalFixedCode) {
        console.log(`  ✅ Feedback loop successful! Using improved code (${feedbackResult.totalIterations} iteration(s))`);
        both.buggy = feedbackResult.finalBuggyCode;
        both.fixed = feedbackResult.finalFixedCode;
      } else {
        console.log(`  ⚠️ Feedback loop completed but not fully successful, using original code`);
      }
    } catch (feedbackError) {
      console.warn(`  ⚠️ Feedback loop failed, using original generated code: ${feedbackError.message}`);
    }
  } else {
    console.log(`  ⚠️ Skipping feedback loop (missing buggy or fixed code)`);
  }

  // Save BUGGY/FIXED modules to folder
  const buggyPath = path.join(OUTPUT_DIR, `post_${postId}_BUGGY.py`);
  const fixedPath = path.join(OUTPUT_DIR, `post_${postId}_FIXED.py`);
  if (both.buggy) await fs.promises.writeFile(buggyPath, both.buggy, "utf-8");
  if (both.fixed) await fs.promises.writeFile(fixedPath, both.fixed, "utf-8");

  // Put ONLY the @contract part(s) into the CSV column (multi-contract supported)
  let specContract =
    extractContractOnly(both.fixed) ||
    extractContractOnly(both.buggy) ||
    "";

  // Fallback: parse from the files we just saved (handles CRLF & any LLM formatting quirks)
  if (!specContract && both.fixed) {
    try {
      const fixedTxt = await fs.promises.readFile(fixedPath, "utf-8");
      specContract = extractContractOnly(fixedTxt) || specContract;
    } catch {}
  }
  if (!specContract && both.buggy) {
    try {
      const buggyTxt = await fs.promises.readFile(buggyPath, "utf-8");
      specContract = extractContractOnly(buggyTxt) || specContract;
    } catch {}
  }

  if (!specContract) {
    console.warn(`⚠️ No @contract snippet found for ${row.postURL} (post_${postId}).`);
  }

  console.log(` Processed: ${row.postURL}`);
  console.log(" Labels:", labelFields);
  console.log(" NLP Contract:", both.nlpContract);
  console.log(" Insight:", both.insight);
  if (both.buggy) console.log("💾 BUGGY ->", buggyPath);
  if (both.fixed) console.log("💾 FIXED ->", fixedPath);
  console.log();

  return {
    postURL: row.postURL,
    mlApiName: "N/A",
    mlLibrary: "N/A",
    ...labelFields,
    nlpContract: both.nlpContract,
    specContract, // may contain multiple concatenated @contract blocks
    insight: both.insight
  };
}

async function readContextFilesAndCSV() {
  const context = await readContextFiles();
  const rows = await readUnseenCSV();
  return { context, rows };
}

async function main() {
  await ensureOutputDir();
  console.log(" Output directory:", OUTPUT_DIR);

  const { context, rows } = await readContextFilesAndCSV();
  const results = [];

  for (const row of rows) {
    try {
      const r = await classifyAndGenerate(row, context);
      results.push(r);
    } catch (err) {
      console.error(` Error processing ${row.postURL}: ${err.message}`);
    }
  }

  await csvWriter.writeRecords(results);
  console.log(` Finished! Results written to ${outputCSVPath}`);
  console.log(` Saved in folder: ${OUTPUT_DIR}`);
}

main();
