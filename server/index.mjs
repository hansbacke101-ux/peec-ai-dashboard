import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  callPeecMcpTool,
  finishPeecMcpAuth,
  getPeecMcpStatus,
  listPeecMcpTools,
  startPeecMcpAuth,
} from "./peecMcp.mjs";

dotenv.config({ path: ".env.local", quiet: true });

const app = express();
const port = Number(process.env.PORT ?? 3001);
const baseUrl = process.env.PEEC_BASE_URL ?? "https://api.peec.ai/customer/v1";
const apiKey = process.env.PEEC_API_KEY;
const projectId = process.env.PEEC_PROJECT_ID;
const aiApiKey = process.env.AZURE_OPENAI_API_KEY;
const aiModel = process.env.AZURE_OPENAI_MODEL ?? "gpt-5.4-nano";
const aiResponsesUrl = process.env.AZURE_OPENAI_RESPONSES_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

app.use(express.json());

function requireApiKey(response) {
  if (apiKey) {
    return true;
  }

  response.status(500).json({
    message: "Missing PEEC_API_KEY. Add it to .env.local.",
  });

  return false;
}

function requireAiConfig(response) {
  if (aiApiKey && aiResponsesUrl) {
    return true;
  }

  response.status(500).json({
    message:
      "Missing Azure OpenAI config. Add AZURE_OPENAI_API_KEY and " +
      "AZURE_OPENAI_RESPONSES_URL to .env.local.",
  });

  return false;
}

async function peecFetch(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? response.statusText;
    throw new Error(message);
  }

  return data;
}

function readAiText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "")
    .join("")
    .trim();
}

function normalizeChatMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => ({
      content: String(message.content ?? "").trim(),
      role: message.role === "assistant" ? "assistant" : "user",
    }))
    .filter((message) => message.content);
}

async function aiRequest(body) {
  const response = await fetch(aiResponsesUrl, {
    body: JSON.stringify({ model: aiModel, ...body }),
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error?.message ?? response.statusText;
    throw new Error(message);
  }

  return data;
}

async function aiGenerate(prompt) {
  const data = await aiRequest({ input: prompt });

  return readAiText(data) ?? "The model returned no text.";
}

function readAiFunctionCalls(data) {
  return data.output?.filter((item) => item.type === "function_call") ?? [];
}

function sanitizeSchema(schema) {
  if (!schema) {
    return { properties: {}, type: "object" };
  }

  if (typeof schema !== "object") {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchema);
  }

  const supportedKeys = new Set([
    "description",
    "enum",
    "items",
    "properties",
    "required",
    "type",
  ]);
  const cleanSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    if (!supportedKeys.has(key)) {
      continue;
    }

    if (key === "properties" && value && typeof value === "object") {
      cleanSchema.properties = Object.fromEntries(
        Object.entries(value).map(([name, propertySchema]) => [
          name,
          sanitizeSchema(propertySchema),
        ]),
      );
      continue;
    }

    cleanSchema[key] = sanitizeSchema(value);
  }

  if (cleanSchema.properties && !cleanSchema.type) {
    cleanSchema.type = "object";
  }

  if (Array.isArray(cleanSchema.required) && cleanSchema.properties) {
    cleanSchema.required = cleanSchema.required.filter(
      (name) => Object.hasOwn(cleanSchema.properties, name),
    );
  }

  return cleanSchema;
}

function toAiTool(tool) {
  return {
    type: "function",
    description: tool.description ?? `Call Peec MCP tool ${tool.name}.`,
    name: tool.name,
    parameters: sanitizeSchema(tool.inputSchema),
  };
}

function compactToolResult(result) {
  const json = JSON.stringify(result);
  if (json.length <= 20000) {
    return result;
  }

  return {
    result: json.slice(0, 20000),
    truncated: true,
  };
}

async function aiGenerateWithPeecTools(prompt) {
  const mcpTools = await listPeecMcpTools();
  const tools = mcpTools.map(toAiTool);
  let input = prompt;
  let previousResponseId;
  const toolCalls = [];

  for (let step = 0; step < 6; step += 1) {
    const data = await aiRequest({
      input,
      previous_response_id: previousResponseId,
      tools,
    });
    const functionCalls = readAiFunctionCalls(data);
    previousResponseId = data.id;

    if (!functionCalls.length) {
      return {
        message: readAiText(data) ?? "The model returned no text.",
        toolCalls,
      };
    }

    const toolOutputs = [];
    for (const functionCall of functionCalls) {
      const toolCall = {
        name: functionCall.name,
        status: "calling",
      };
      toolCalls.push(toolCall);

      try {
        const result = await callPeecMcpTool(
          functionCall.name,
          JSON.parse(functionCall.arguments || "{}"),
        );
        toolCall.status = "completed";
        toolOutputs.push({
          call_id: functionCall.call_id,
          output: JSON.stringify(compactToolResult(result)),
          type: "function_call_output",
        });
      } catch (error) {
        toolCall.status = "failed";
        toolOutputs.push({
          call_id: functionCall.call_id,
          output: JSON.stringify({ error: error.message }),
          type: "function_call_output",
        });
      }
    }

    input = toolOutputs;
  }

  const data = await aiRequest({
    input: "Give the best concise answer from the tool results so far.",
    previous_response_id: previousResponseId,
  });

  return {
    message: readAiText(data) ?? "The model returned no final text.",
    toolCalls,
  };
}

async function getPeecChatContext({ endDate, projectId, startDate }) {
  if (!apiKey || !projectId || !startDate || !endDate) {
    return "No Peec project context is selected.";
  }

  const data = await peecFetch("/reports/brands", {
    body: JSON.stringify({
      end_date: endDate,
      limit: 12,
      project_id: projectId,
      start_date: startDate,
    }),
    method: "POST",
  });

  return JSON.stringify(data, null, 2);
}

async function getConfiguredProject() {
  if (!projectId) {
    return null;
  }

  try {
    const data = await peecFetch(`/brands?project_id=${projectId}&limit=100`);
    const ownBrand = data.data?.find((brand) => brand.is_own);

    return {
      id: projectId,
      name: ownBrand?.name ?? "Peec project",
      status: "Configured",
    };
  } catch {
    return {
      id: projectId,
      name: "Peec project",
      status: "Configured",
    };
  }
}

app.get("/api/health", (_request, response) => {
  response.json({
    configured: Boolean(apiKey),
    aiConfigured: Boolean(aiApiKey && aiResponsesUrl),
    aiModel,
    hasProjectId: Boolean(projectId),
    baseUrl,
  });
});

app.get("/api/peec-mcp/status", async (_request, response) => {
  response.json(await getPeecMcpStatus());
});

app.get("/api/peec-mcp/connect", async (_request, response) => {
  try {
    const result = await startPeecMcpAuth();
    if (result.authenticated) {
      response.send("Peec MCP is already connected.");
      return;
    }

    if (!result.authUrl) {
      response.status(500).send("Peec MCP did not return an auth URL.");
      return;
    }

    response.redirect(result.authUrl);
  } catch (error) {
    response.status(500).send(error.message);
  }
});

app.get("/api/peec-mcp/callback", async (request, response) => {
  try {
    await finishPeecMcpAuth(request.query.code);
    response.send("Peec MCP authorization complete. You can close this tab.");
  } catch (error) {
    response.status(500).send(error.message);
  }
});

app.get("/api/peec-mcp/tools", async (_request, response) => {
  try {
    const tools = await listPeecMcpTools();
    response.json({ tools });
  } catch (error) {
    response.status(502).json({ message: error.message });
  }
});

app.get("/api/peec/projects", async (_request, response) => {
  if (!requireApiKey(response)) {
    return;
  }

  const configuredProject = await getConfiguredProject();

  if (configuredProject) {
    response.json({
      data: [configuredProject],
    });
    return;
  }

  try {
    const data = await peecFetch("/projects?limit=100");
    response.json(data);
  } catch (error) {
    response.status(502).json({ message: error.message });
  }
});

app.get("/api/peec/brands-report", async (request, response) => {
  if (!requireApiKey(response)) {
    return;
  }

  const requestedProjectId = request.query.projectId ?? projectId;
  const { startDate, endDate } = request.query;

  if (!requestedProjectId || !startDate || !endDate) {
    response.status(400).json({
      message: "projectId, startDate, and endDate are required.",
    });
    return;
  }

  try {
    const data = await peecFetch("/reports/brands", {
      body: JSON.stringify({
        project_id: requestedProjectId,
        start_date: startDate,
        end_date: endDate,
        limit: 25,
      }),
      method: "POST",
    });

    response.json(data);
  } catch (error) {
    response.status(502).json({ message: error.message });
  }
});

app.post("/api/ai/report-summary", async (request, response) => {
  if (!requireAiConfig(response)) {
    return;
  }

  const { endDate, projectName, report, startDate } = request.body;

  if (!Array.isArray(report) || !startDate || !endDate) {
    response.status(400).json({
      message: "report, startDate, and endDate are required.",
    });
    return;
  }

  const compactReport = report.slice(0, 12).map((brand) => ({
    brand: brand.brandName,
    position: brand.position,
    sentiment: brand.sentiment,
    shareOfVoice: brand.shareOfVoice,
    visibility: brand.visibility,
  }));

  const prompt = [
    "You are an AI search analytics strategist.",
    `Project: ${projectName ?? "Peec project"}.`,
    `Date range: ${startDate} to ${endDate}.`,
    "Summarize this Peec AI brand report in 4 concise bullets.",
    "Include the strongest competitor, main risk, and one next action.",
    JSON.stringify(compactReport, null, 2),
  ].join("\n");

  try {
    const summary = await aiGenerate(prompt);
    response.json({ model: aiModel, summary });
  } catch (error) {
    response.status(502).json({ message: error.message });
  }
});

app.post("/api/chat", async (request, response) => {
  if (!requireAiConfig(response)) {
    return;
  }

  const { endDate, projectId, projectName, startDate } = request.body;
  const messages = normalizeChatMessages(request.body.messages);

  if (!messages.length) {
    response.status(400).json({ message: "messages are required." });
    return;
  }

  try {
    const peecContext = await getPeecChatContext({
      endDate,
      projectId,
      startDate,
    });

    const conversation = messages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const prompt = [
      "You are the Peec AI dashboard assistant.",
      "Use the supplied Peec AI context when answering.",
      "If the context is insufficient, say what data is missing.",
      "Keep answers concise and actionable.",
      `Model: ${aiModel}.`,
      `Project: ${projectName ?? "Peec project"}.`,
      `Date range: ${startDate ?? "unknown"} to ${endDate ?? "unknown"}.`,
      `Default project_id: ${projectId ?? "unknown"}.`,
      "Peec context:",
      peecContext,
      "You can call Peec MCP read tools for more data when needed.",
      "Write and delete tools are not available in this chat yet.",
      "Conversation:",
      conversation,
    ].join("\n");

    const { message, toolCalls } = await aiGenerateWithPeecTools(prompt);

    response.json({ message, model: aiModel, toolCalls });
  } catch (error) {
    response.status(502).json({ message: error.message });
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ message: "API route not found." });
});

app.use(express.static(distDir));

app.use((_request, response) => {
  response.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Peec proxy listening on http://localhost:${port}`);
});
