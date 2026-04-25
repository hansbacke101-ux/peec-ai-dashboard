# GoGeo

A local React and Express dashboard powered by Peec AI for exploring search
metrics.
It loads Peec project data through a server-side proxy so API keys stay out
of the browser bundle.

## Features

- Project selector for Peec brand reports.
- Visual dashboard for visibility, share of voice, sentiment, and position.
- Company-specific pages based on the selected brand.
- Chat assistant that can use the selected project and report context.

## Requirements

- Node.js 20 or newer.
- Peec API credentials.
- Azure OpenAI credentials if you want to use the chat assistant.

## Setup

Install dependencies:

```sh
npm install
```

Create a local environment file:

```sh
cp .env.example .env.local
```

Fill in `.env.local` with your local credentials:

```sh
PEEC_API_KEY=
PEEC_PROJECT_ID=
PEEC_BASE_URL=https://api.peec.ai/customer/v1
PEEC_MCP_URL=https://api.peec.ai/mcp
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_MODEL=gpt-5.4-nano
AZURE_OPENAI_RESPONSES_URL=https://your-resource.openai.azure.com/openai/v1/responses
PORT=3001
APP_URL=http://localhost:3001
```

Never commit `.env.local` or any generated auth token files. The repository
keeps `.env.example` as the only tracked environment template.

The Peec dashboard needs `PEEC_API_KEY`. `PEEC_PROJECT_ID` is optional; when
present, the app loads that project directly. The chat assistant needs both
`AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_RESPONSES_URL`.

## Development

Run the Vite client and Express proxy together:

```sh
npm run dev
```

Open the local app at the Vite URL printed in the terminal.

## Scripts

- `npm run dev` starts the client and server in watch mode.
- `npm run build` type-checks and builds the production client.
- `npm run preview` previews the built client.
- `npm run start` starts the Express server.
- `npm run typecheck` runs TypeScript without emitting files.

## Sensitive Files

The `.gitignore` excludes local environment files, Peec MCP auth state,
credential JSON files, private keys, logs, build output, and dependency
folders. If you add another file that contains API keys, tokens, or private
credentials, add it to `.gitignore` before committing.

## Public Repository Checklist

- Keep `.env.example` tracked and `.env.local` untracked.
- Do not commit `node_modules`, `dist`, auth state, or logs.
- Rotate any key that was ever committed, pasted into an issue, or shared.
- Add a license file before inviting external contributors.
