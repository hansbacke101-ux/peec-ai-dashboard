import { FormEvent, useState } from "react";

type ChatbotProps = {
  endDate: string;
  projectId: string;
  projectName: string;
  reportCount: number;
  startDate: string;
};

type ChatRole = "assistant" | "tool" | "user";

type ChatMessage = {
  content: string;
  id: string;
  role: ChatRole;
};

type ToolCall = {
  name: string;
  status: "calling" | "completed" | "failed";
};

type ChatResponse = {
  message: string;
  model: string;
  toolCalls?: ToolCall[];
};

const welcomeMessage: ChatMessage = {
  content: "Ask me about your Peec AI brand metrics or next actions.",
  id: "welcome",
  role: "assistant",
};

function createId() {
  return crypto.randomUUID();
}

function formatToolCall(toolCall: ToolCall) {
  const verb = toolCall.status === "completed" ? "Completed" : "Calling";
  return `${verb} tool: ${toolCall.name}`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const text = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson && text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  if (!data) {
    throw new Error("The API returned a non-JSON response.");
  }

  return data;
}

export default function Chatbot({
  endDate,
  projectId,
  projectName,
  reportCount,
  startDate,
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();

    if (!content || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      content,
      id: createId(),
      role: "user",
    };

    const nextMessages = [...messages, userMessage];
    const localToolMessage: ChatMessage = {
      content: "Checking Peec MCP tools...",
      id: createId(),
      role: "tool",
    };

    setMessages([...nextMessages, localToolMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postJson<ChatResponse>("/api/chat", {
        endDate,
        messages: nextMessages.map(({ role, content: text }) => ({
          content: text,
          role,
        })),
        projectId,
        projectName,
        startDate,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        ...(data.toolCalls ?? []).map((toolCall) => ({
          content: formatToolCall(toolCall),
          id: createId(),
          role: "tool" as const,
        })),
        {
          content: data.message,
          id: createId(),
          role: "assistant",
        },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "The chat request failed.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          content: message,
          id: createId(),
          role: "assistant",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chatDock ${isOpen ? "isOpen" : "isCollapsed"}`}>
      <button
        aria-expanded={isOpen}
        className="chatToggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? "Close" : "Ask Peec AI"}
      </button>

      <aside aria-hidden={!isOpen} className="chatPanel">
        <header className="chatHeader">
          <div>
            <p className="eyebrow">GPT-5.4 Nano</p>
            <h2>Peec AI chat</h2>
          </div>
          <p>{reportCount} brand rows in context</p>
        </header>

        <div className="chatMessages" role="log">
          {messages.map((message) => (
            <article
              className={`chatMessage ${message.role}`}
              key={message.id}
            >
              {message.content}
            </article>
          ))}
          {isLoading ? (
            <article className="chatMessage assistant">Writing answer...</article>
          ) : null}
        </div>

        <form className="chatForm" onSubmit={submitMessage}>
          <textarea
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about visibility, sentiment, or competitors..."
            rows={3}
            value={input}
          />
          <button disabled={isLoading || !input.trim()} type="submit">
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
