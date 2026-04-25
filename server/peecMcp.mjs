import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from
  "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "node:fs/promises";
import path from "node:path";

const peecMcpUrl = process.env.PEEC_MCP_URL ?? "https://api.peec.ai/mcp";
const appUrl = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;
const redirectUrl = new URL("/api/peec-mcp/callback", appUrl).toString();
const authPath = path.resolve(".peec-mcp-auth.json");
const writeToolPattern = /^(create|update|delete)_/;

let state = {};
let stateLoaded = false;
let client = null;
let transport = null;
let pendingAuthUrl = null;
let connectPromise = null;

async function loadState() {
  if (stateLoaded) {
    return state;
  }

  try {
    state = JSON.parse(await fs.readFile(authPath, "utf8"));
  } catch {
    state = {};
  }

  stateLoaded = true;
  return state;
}

async function saveState(patch) {
  state = { ...(await loadState()), ...patch };
  await fs.writeFile(authPath, `${JSON.stringify(state, null, 2)}\n`);
}

function createOAuthProvider() {
  const clientMetadata = {
    client_name: "Peec Hack Dashboard",
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: [redirectUrl],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  };

  return {
    get redirectUrl() {
      return redirectUrl;
    },
    get clientMetadata() {
      return clientMetadata;
    },
    async clientInformation() {
      return (await loadState()).clientInformation;
    },
    async saveClientInformation(clientInformation) {
      await saveState({ clientInformation });
    },
    async tokens() {
      return (await loadState()).tokens;
    },
    async saveTokens(tokens) {
      await saveState({ tokens });
    },
    redirectToAuthorization(authorizationUrl) {
      pendingAuthUrl = authorizationUrl.toString();
    },
    async saveCodeVerifier(codeVerifier) {
      await saveState({ codeVerifier });
    },
    async codeVerifier() {
      const codeVerifier = (await loadState()).codeVerifier;
      if (!codeVerifier) {
        throw new Error("Missing Peec MCP OAuth code verifier.");
      }
      return codeVerifier;
    },
    async saveDiscoveryState(discoveryState) {
      await saveState({ discoveryState });
    },
    async discoveryState() {
      return (await loadState()).discoveryState;
    },
    async invalidateCredentials(scope) {
      const nextState = { ...(await loadState()) };
      if (scope === "all" || scope === "client") {
        delete nextState.clientInformation;
      }
      if (scope === "all" || scope === "tokens") {
        delete nextState.tokens;
      }
      if (scope === "all" || scope === "verifier") {
        delete nextState.codeVerifier;
      }
      if (scope === "all" || scope === "discovery") {
        delete nextState.discoveryState;
      }
      state = nextState;
      await fs.writeFile(authPath, `${JSON.stringify(state, null, 2)}\n`);
    },
  };
}

function createClient() {
  const oauthProvider = createOAuthProvider();
  const nextClient = new Client(
    { name: "peec-hack-dashboard", version: "1.0.0" },
    { capabilities: {} },
  );
  const nextTransport = new StreamableHTTPClientTransport(
    new URL(peecMcpUrl),
    { authProvider: oauthProvider },
  );

  return { nextClient, nextTransport };
}

async function connectMcp() {
  if (client) {
    return { client, authenticated: true };
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const { nextClient, nextTransport } = createClient();
    try {
      await nextClient.connect(nextTransport);
      client = nextClient;
      transport = nextTransport;
      pendingAuthUrl = null;
      return { client, authenticated: true };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return {
          authUrl: pendingAuthUrl,
          authenticated: false,
        };
      }
      throw error;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function getPeecMcpStatus() {
  const authState = await loadState();
  return {
    authenticated: Boolean(client || authState.tokens),
    authUrl: pendingAuthUrl,
    serverUrl: peecMcpUrl,
  };
}

export async function startPeecMcpAuth() {
  const result = await connectMcp();
  return {
    authenticated: result.authenticated,
    authUrl: result.authUrl ?? pendingAuthUrl,
  };
}

export async function finishPeecMcpAuth(code) {
  if (!code) {
    throw new Error("Missing OAuth code.");
  }

  const { nextTransport } = createClient();
  await nextTransport.finishAuth(code);

  if (client) {
    await client.close();
  }

  client = null;
  transport = null;
  pendingAuthUrl = null;
  await connectMcp();
}

export async function getPeecMcpClient() {
  const result = await connectMcp();
  if (!result.authenticated) {
    throw new Error(
      `Authorize Peec MCP first: ${result.authUrl ?? "/api/peec-mcp/connect"}`,
    );
  }
  return result.client;
}

export async function listPeecMcpTools({ includeWrites = false } = {}) {
  const mcpClient = await getPeecMcpClient();
  const tools = [];
  let cursor;

  do {
    const result = await mcpClient.listTools({ cursor });
    tools.push(...result.tools);
    cursor = result.nextCursor;
  } while (cursor);

  if (includeWrites) {
    return tools;
  }

  return tools.filter((tool) => !writeToolPattern.test(tool.name));
}

export async function callPeecMcpTool(name, args) {
  if (writeToolPattern.test(name)) {
    throw new Error(`Peec MCP write tool "${name}" needs explicit UI approval.`);
  }

  const mcpClient = await getPeecMcpClient();
  return mcpClient.callTool({
    arguments: args ?? {},
    name,
  });
}
