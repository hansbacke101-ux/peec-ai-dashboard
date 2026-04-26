import { createOpenAI } from "@ai-sdk/openai";
import {
  BuiltInAgent,
  CopilotRuntime,
  defineTool,
} from "@copilotkit/runtime/v2";
import { createCopilotEndpointSingleRouteExpress } from
  "@copilotkit/runtime/v2/express";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
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
const aiModel = process.env.AZURE_OPENAI_MODEL ?? "gpt-5.5-1";
const aiResponsesUrl = process.env.AZURE_OPENAI_RESPONSES_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const bodyJsonLimit = process.env.BODY_JSON_LIMIT ?? "10mb";

app.use(
  express.json({
    limit: bodyJsonLimit,
  }),
);

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

function getOpenAIBaseUrl() {
  return aiResponsesUrl?.replace(/\/responses\/?$/, "");
}

function createCopilotLanguageModel() {
  const baseURL = getOpenAIBaseUrl();

  if (!aiApiKey || !baseURL) {
    return null;
  }

  const provider = createOpenAI({
    apiKey: aiApiKey,
    baseURL,
    headers: {
      "api-key": aiApiKey,
    },
  });

  return provider.chat(aiModel);
}

/**
 * When the client runs CopilotKit frontend tools, the next HTTP request can
 * include assistant toolCalls without matching `role: "tool"` rows yet.
 * `streamText` then throws AI_MissingToolResultsError. Add minimal placeholders
 * so every toolCallId has a result before the agent runs.
 */
function collectAssistantToolCallIds(message) {
  const ids = [];
  if (!message || typeof message !== "object") {
    return ids;
  }

  if (Array.isArray(message.toolCalls)) {
    for (const call of message.toolCalls) {
      if (call?.id) {
        ids.push(String(call.id));
      }
    }
  }

  const content = Array.isArray(message.content) ? message.content : [];
  for (const chunk of content) {
    const fromChunk =
      chunk?.toolCallId ??
      chunk?.tool_call_id ??
      chunk?.id ??
      chunk?.callId ??
      chunk?.call_id;
    const chunkType = String(chunk?.type ?? "");
    if (
      fromChunk &&
      (chunkType.includes("tool-call") ||
        chunkType.includes("tool_call") ||
        chunkType === "function_call")
    ) {
      ids.push(String(fromChunk));
    }
  }

  return ids;
}

function readToolResultId(message) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const direct =
    message.toolCallId ??
    message.tool_call_id ??
    message.callId ??
    message.call_id;
  if (direct) {
    return String(direct);
  }

  const content = Array.isArray(message.content) ? message.content : [];
  for (const chunk of content) {
    const fromChunk =
      chunk?.toolCallId ??
      chunk?.tool_call_id ??
      chunk?.callId ??
      chunk?.call_id ??
      chunk?.id;
    const chunkType = String(chunk?.type ?? "");
    if (
      fromChunk &&
      (chunkType.includes("tool-result") ||
        chunkType.includes("tool_result") ||
        chunkType === "function_call_output")
    ) {
      return String(fromChunk);
    }
  }

  return null;
}

function ensureAgUiToolResultsForCopilot(messages) {
  if (!Array.isArray(messages)) {
    return messages;
  }

  const withResult = new Set();
  for (const msg of messages) {
    if (msg?.role !== "tool") {
      continue;
    }
    const id = readToolResultId(msg);
    if (id) {
      withResult.add(id);
    }
  }

  const out = [];

  for (const msg of messages) {
    out.push(msg);

    if (msg?.role !== "assistant") {
      continue;
    }

    for (const id of collectAssistantToolCallIds(msg)) {
      if (!id || withResult.has(id)) {
        continue;
      }

      withResult.add(id);
      out.push({
        content: JSON.stringify({
          message:
            "Client tool result was not on the server message list; " +
            "placeholder so the run can continue.",
          ok: true,
        }),
        role: "tool",
        toolCallId: id,
      });
    }
  }

  return out;
}

class DefaultAgentWithToolResultGuard extends BuiltInAgent {
  run(input) {
    const next =
      input && typeof input === "object"
        ? {
            ...input,
            messages: ensureAgUiToolResultsForCopilot(input.messages),
          }
        : input;

    return super.run(next);
  }
}

const peecRuntimeTools = [
  defineTool({
    name: "listPeecReadTools",
    description: "List read-only Peec MCP tools available to the dashboard.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const tools = await listPeecMcpTools();
        return {
          available: true,
          tools: tools.map((tool) => ({
            description: tool.description,
            name: tool.name,
            parameters: sanitizeSchema(tool.inputSchema),
          })),
        };
      } catch (error) {
        return {
          available: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown Peec MCP load error.",
          tools: [],
        };
      }
    },
  }),
  defineTool({
    name: "callPeecReadTool",
    description:
      "Call a read-only Peec MCP tool. Pass arguments as a JSON string.",
    parameters: z.object({
      argsJson: z
        .string()
        .optional()
        .describe("JSON object string with the tool arguments."),
      toolName: z.string().describe("The exact Peec MCP tool name."),
    }),
    execute: async ({ toolName, argsJson = "{}" }) => {
      try {
        const args = JSON.parse(argsJson || "{}");
        const result = await callPeecMcpTool(toolName, args);
        return compactToolResult(result);
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Unknown Peec MCP tool call error.",
          ok: false,
          toolName,
        };
      }
    },
  }),
];

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

const copilotLanguageModel = createCopilotLanguageModel();
const copilotRuntime = copilotLanguageModel
  ? new CopilotRuntime({
      agents: {
        default: new DefaultAgentWithToolResultGuard({
          maxSteps: 5,
          model: copilotLanguageModel,
          prompt: [
            "You are the GoGeo dashboard copilot, powered by Peec AI.",
            "Proactively answer Peec data questions with the Peec AI MCP read",
            "tools: call listPeecReadTools when needed, then callPeecReadTool",
            "with the correct toolName and arguments. Prefer MCP-grounded",
            "facts over assumptions or stale chat context alone.",
            "Use showPieChart for share, showVerticalBarChart for bar compare,",
            "and showLineChart for one or more lines: xLabels in order plus a",
            "series array of { label, values } per line (values length = xLabels).",
            "Use other frontend tools for dashboard UI (navigation, focus,",
            "sorting, comparison). Keep answers concise and practical.",
          ].join(" "),
          tools: peecRuntimeTools,
        }),
      },
    })
  : null;
const copilotRouter = copilotRuntime
  ? createCopilotEndpointSingleRouteExpress({
      basePath: "/api/copilotkit",
      hooks: {
        onError: ({ error, route }) => {
          console.error("CopilotKit runtime error", route, error);
        },
      },
      runtime: copilotRuntime,
    })
  : null;

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
    "Summarize this GoGeo brand report in 4 concise bullets.",
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
      "You are the GoGeo dashboard assistant, powered by Peec AI.",
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

if (copilotRouter) {
  app.use(copilotRouter);
} else {
  app.use("/api/copilotkit", (_request, response) => {
    response.status(500).json({
      message:
        "Missing Azure OpenAI config. Add AZURE_OPENAI_API_KEY and " +
        "AZURE_OPENAI_RESPONSES_URL to .env.local.",
    });
  });
}

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
