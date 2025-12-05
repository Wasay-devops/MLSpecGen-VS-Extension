import fs from "fs";
import csvParser from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import axios from "axios";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const unseenFile = "unseen3_filtered.csv";
const outputCSVPath = "deepoutput_claude_final.csv";
const researchPaperPath = "rcontext.txt";
const actionableExamplesPath = "actionable_examples.txt";
const pycontractDocPath1 = "pycontracts_doc.txt";
const pycontractDocPath2 = "pycontracts_deep.txt";
const embeddedExamplesPath = "embedded_examples.json";
const TOP_K = 5;
const EMBED_MODEL = "nomic-embed-text";
const CHAT_MODEL = "claude-3-opus-20240229";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    { id: "specContract", title: "Specification Contract (PyContract)" },
    { id: "insight", title: "Actionable Insight" }
  ]
});

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const norm = x => Math.sqrt(x.reduce((sum, val) => sum + val * val, 0));
  return dot / (norm(a) * norm(b));
}

function extractPostId(url) {
  const match = url.match(/questions\/(\d+)/);
  return match ? match[1] : `post_${Math.random().toString(36).substring(2, 8)}`;
}

function extractLabel(response, field, singleWord = false) {
  const regex = new RegExp(field + ":[ \t]*(.+)", "i");
  const match = response.match(regex);
  if (!match) return "";
  const fullText = match[1].trim();
  return singleWord ? fullText.split(/,|;|\/| and /)[0].trim() : fullText;
}

function extractPyContractOutput(content) {
  const codeMatch = content.match(/```python([\s\S]*?)```/);
  const nlpMatch = content.match(/NLP Contract:\s*-\s*([\s\S]*?)\n(?:Actionable Insight:|$)/i);
  const insightMatch = content.match(/Actionable Insight:\s*-\s*([\s\S]*)/i);
  return {
    specContract: codeMatch ? codeMatch[1].trim() : "Not found",
    nlpContract: nlpMatch ? nlpMatch[1].trim() : "Not found",
    insight: insightMatch ? insightMatch[1].trim() : "Not found"
  };
}

async function getEmbedding(text) {
  const response = await axios.post("http://127.0.0.1:11434/api/embeddings", {
    model: EMBED_MODEL,
    input: text
  });
  return response.data.embedding;
}

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

async function readUnseenCSV() {
  const posts = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(unseenFile)
      .pipe(csvParser())
      .on("data", row => {
        if (row["SO Post URL"]) {
          posts.push({
            postURL: row["SO Post URL"],
            question: row["Question"] || "",
            answer: row["Answer"] || ""
          });
        }
      })
      .on("end", () => resolve(posts))
      .on("error", reject);
  });
}

async function runPrompt(prompt) {
  const completion = await anthropic.messages.create({
    model: CHAT_MODEL,
    max_tokens: 2048,
    temperature: 0.3,
    system: "You are an expert in ML contract violations and PyContracts.",
    messages: [{ role: "user", content: prompt }]
  });
  return completion.content[0].text;
}

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


--- NEW POST TO LABEL ---
URL: ${post.postURL}
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

function buildPyPrompt(context, post, label) {
  return `
You are an expert Python engineer and ML contract verifier.

--- RESEARCH CONTEXT ---
${context.researchPaper}

--- PYCONTRACT DOCUMENTATION ---
${context.pycontractDoc}

--- ACTIONABLE INSIGHT EXAMPLES ---
${context.actionableExamples}

--- STACK OVERFLOW POST ---
URL: ${post.postURL}
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

--- TASK ---
1. Generate a runnable Python function using "@contract.
2. Complete missing parts if needed.
3. Output:
- Full PyContract
- NLP Contract
- Actionable Insight

--- FORMAT ---
PyContract Code:
\`\`\`python
# your function here
\`\`\`

NLP Contract:
- ...

Actionable Insight:
- ...
`;
}

async function classifyAndGenerate(post, context) {
  const text = `${post.question}\n\n${post.answer}`;
  const embedding = await getEmbedding(text);
  const topK = context.embeddedExamples
    .map(ex => ({ ...ex, score: cosineSimilarity(embedding, ex.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  const labelingPrompt = buildLabelingPrompt(context.researchPaper, context.actionableExamples, topK, post);
  const labelingResponse = await runPrompt(labelingPrompt);

  const labels = {
    level1: extractLabel(labelingResponse, "Level 1", true),
    level2: extractLabel(labelingResponse, "Level 2", true),
    level3: extractLabel(labelingResponse, "Level 3", true),
    rootCause: extractLabel(labelingResponse, "Root Cause"),
    effect: extractLabel(labelingResponse, "Effect"),
    contractViolationLocation: extractLabel(labelingResponse, "Contract Violation Location"),
    detectionTechnique: extractLabel(labelingResponse, "Detection Technique"),
    reasonsForLabeling: extractLabel(labelingResponse, "Reasons for labeling"),
    reasonsForNotLabeling: extractLabel(labelingResponse, "Reasons for not labelling"),
    mlApiName: "N/A",
    mlLibrary: "N/A"
  };

  const pyPrompt = buildPyPrompt(context, post, labels);
  const pyResponse = await runPrompt(pyPrompt);
  const pyOut = extractPyContractOutput(pyResponse);

  fs.writeFileSync(`post_${extractPostId(post.postURL)}.py`, pyOut.specContract);

  return {
    postURL: post.postURL,
    ...labels,
    leafContractCategory: labels.level3,
    nlpContract: pyOut.nlpContract,
    specContract: pyOut.specContract,
    insight: pyOut.insight
  };
}

async function main() {
  const context = await readContextFiles();
  const posts = await readUnseenCSV();
  const results = [];

  for (const post of posts) {
    try {
      const row = await classifyAndGenerate(post, context);
      results.push(row);
    } catch (err) {
      console.error(`❌ Error processing ${post.postURL}: ${err.message}`);
    }
  }

  await csvWriter.writeRecords(results);
  console.log(`✅ All results saved to ${outputCSVPath}`);
}

main();
