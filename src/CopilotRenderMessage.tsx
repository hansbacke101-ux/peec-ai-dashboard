import { useId, useState } from "react";
import type {
  AIMessage,
  Message,
  ToolCall,
  ToolResult,
} from "@copilotkit/shared";
import {
  ImageRenderer,
  UserMessage,
  type AssistantMessageProps,
  type RenderMessageProps,
} from "@copilotkit/react-ui";
import { AssistantMessageNoControls } from "./AssistantMessageNoControls";
import geodudeAvatarUrl from "./assets/geodude-avatar.svg";

function CollapseIcon({ expanded }: { expanded: boolean }) {
  return (
    <span
      aria-hidden
      className="copilotToolToggleIcon"
      data-expanded={expanded}
    >
      {expanded ? (
        <svg
          className="copilotToolChevron"
          height="16"
          viewBox="0 0 20 20"
          width="16"
        >
          <path
            d="M5 12.5 10 7.5l5 5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ) : (
        <svg
          className="copilotToolChevron"
          height="16"
          viewBox="0 0 20 20"
          width="16"
        >
          <path
            d="M5 7.5 10 12.5l5-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      )}
    </span>
  );
}

const CALL_PEEC_READ = "callPeecReadTool";
const LIST_PEEC_READ = "listPeecReadTools";

function normalizeText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncateText(value: unknown, max: number) {
  const text = normalizeText(value);
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

/**
 * Peec data tools: inner MCP name + `peec` tag.
 * UI tools (`useFrontendTool`, etc.): action name + `copilotkit` tag.
 */
function toolTagForFunctionName(
  name: string,
): "copilotkit" | "peec" {
  if (name === CALL_PEEC_READ || name === LIST_PEEC_READ) {
    return "peec";
  }
  return "copilotkit";
}

function getToolCallDisplay(call: ToolCall): {
  displayTitle: string;
  tag: "copilotkit" | "peec";
} {
  const n = call.function.name;
  if (n === CALL_PEEC_READ) {
    try {
      const args = JSON.parse(call.function.arguments || "{}");
      if (
        typeof args.toolName === "string" &&
        args.toolName.length > 0
      ) {
        return { displayTitle: args.toolName, tag: "peec" };
      }
    } catch {
      /* ignore */
    }
    return { displayTitle: n, tag: "peec" };
  }
  if (n === LIST_PEEC_READ) {
    return { displayTitle: "list tools", tag: "peec" };
  }
  return { displayTitle: n, tag: toolTagForFunctionName(n) };
}

function findToolCallForResult(
  toolMessage: ToolResult,
  messages: Message[],
): ToolCall | undefined {
  const { toolCallId } = toolMessage;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const row = messages[i];
    if (row?.role !== "assistant") {
      continue;
    }
    const calls = (row as AIMessage).toolCalls;
    const hit = calls?.find((c) => c.id === toolCallId);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

function uniqueTags(
  displays: { tag: "copilotkit" | "peec" }[],
): ("copilotkit" | "peec")[] {
  const set = new Set<"copilotkit" | "peec">();
  for (const d of displays) {
    set.add(d.tag);
  }
  const order: ("copilotkit" | "peec")[] = ["copilotkit", "peec"];
  return order.filter((t) => set.has(t));
}

function oneLineToolCallSummary(
  calls: NonNullable<AIMessage["toolCalls"]>,
) {
  const displays = calls.map((c) => getToolCallDisplay(c));
  const text = displays.map((d) => d.displayTitle).join(", ");
  return {
    summaryText: truncateText(text, 64),
    tags: uniqueTags(displays),
  };
}

function resolveToolFunctionName(
  toolMessage: ToolResult,
  messages: Message[],
): string {
  if (toolMessage.toolName) {
    return toolMessage.toolName;
  }
  const { toolCallId } = toolMessage;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const row = messages[i];
    if (row?.role !== "assistant") {
      continue;
    }
    const calls = (row as AIMessage).toolCalls;
    const hit = calls?.find((c: ToolCall) => c.id === toolCallId);
    if (hit) {
      return hit.function.name;
    }
  }
  return "Tool";
}

function ToolOriginTag({ tag }: { tag: "copilotkit" | "peec" }) {
  if (tag === "peec") {
    return (
      <span className="copilotToolPeecTag" data-tool-origin="peec">
        peec
      </span>
    );
  }
  return (
    <span
      className="copilotToolCopilotkitTag"
      data-tool-origin="copilotkit"
    >
      copilotkit
    </span>
  );
}

function ToolCallStrip({ message }: { message: AIMessage }) {
  const [expanded, setExpanded] = useState(false);
  const calls = message.toolCalls;
  const panelId = useId();
  if (!calls?.length) {
    return null;
  }
  const { summaryText, tags } = oneLineToolCallSummary(calls);
  const dataOrigin =
    tags.length === 1 ? tags[0] : tags.length > 1 ? "mixed" : undefined;
  return (
    <div
      className="copilotToolBlock"
      data-tool-origin={dataOrigin}
    >
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        className="copilotToolToggle"
        type="button"
        onClick={() => setExpanded((v) => !v)}
      >
        <CollapseIcon expanded={expanded} />
        <span className="copilotToolCallLabel">Tool</span>
        <span className="copilotToolSummary">{summaryText}</span>
        {tags.map((t) => (
          <ToolOriginTag key={t} tag={t} />
        ))}
      </button>
      {expanded ? (
        <div className="copilotToolCallBanner" id={panelId}>
          {calls.map((call) => {
            const d = getToolCallDisplay(call);
            return (
              <div
                className="copilotToolCallLine"
                data-tool-origin={d.tag}
                key={call.id}
              >
                <div className="copilotToolCallLineHead">
                  <code className="copilotToolCallName">
                    {d.displayTitle}
                  </code>
                  <ToolOriginTag tag={d.tag} />
                </div>
                {call.function.arguments &&
                call.function.arguments !== "{}" ? (
                  <span className="copilotToolCallArgs">
                    {truncateText(call.function.arguments, 200)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ToolResultCard({
  message,
  messages,
}: {
  message: ToolResult;
  messages: Message[];
}) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const err = normalizeText(message.error);
  const content = normalizeText(message.content);
  const fullText = err ? `Error: ${err}` : content;
  const preview = err
    ? `Error: ${truncateText(err, 48)}`
    : truncateText(content, 56);
  const linkedCall = findToolCallForResult(message, messages);
  const orphanName =
    message.toolName ?? resolveToolFunctionName(message, messages);
  const display = linkedCall
    ? getToolCallDisplay(linkedCall)
    : {
        displayTitle: orphanName,
        tag: toolTagForFunctionName(orphanName),
      };
  const { displayTitle, tag } = display;
  return (
    <div
      className="copilotToolBlock"
      data-message-role="tool"
      data-tool-origin={tag}
    >
      <button
        aria-controls={bodyId}
        aria-expanded={expanded}
        className="copilotToolToggle copilotToolToggleResult"
        type="button"
        onClick={() => setExpanded((v) => !v)}
      >
        <CollapseIcon expanded={expanded} />
        <span className="copilotToolResultName">{displayTitle}</span>
        <ToolOriginTag tag={tag} />
        {!expanded ? (
          <span className="copilotToolSummary">· {preview}</span>
        ) : null}
      </button>
      {expanded ? (
        <div className="copilotToolResultBodyWrap" id={bodyId}>
          <pre className="copilotToolResultBody">{fullText}</pre>
        </div>
      ) : null}
    </div>
  );
}

/**
 * CopilotKit’s default `RenderMessage` only renders `user` and `assistant`.
 * `role: "tool"` messages return `null`, so tool calls never appear in the
 * transcript. This renderer shows in-flight tool calls and tool results.
 */
export function CopilotRenderMessage({
  ImageRenderer: ImageRendererOverride,
  UserMessage: UserMessageOverride,
  ...props
}: RenderMessageProps) {
  // `CopilotChat` passes the stock `AssistantMessage` (with controls) on
  // every render. Ignore it and always use the no-control bubble.
  const AssistantMessageComponent = AssistantMessageNoControls;
  const ImageRendererComponent = ImageRendererOverride ?? ImageRenderer;
  const UserMessageComponent = UserMessageOverride ?? UserMessage;

  const {
    message,
    messages,
    inProgress,
    index,
    isCurrentMessage,
    markdownTagRenderers,
  } = props;

  switch (message.role) {
    case "user":
      return (
        <UserMessageComponent
          data-message-role="user"
          ImageRenderer={ImageRendererComponent}
          key={index}
          message={message}
          rawData={message}
        />
      );
    case "assistant": {
      const aiMessage = message as AIMessage;
      const assistantProps: AssistantMessageProps = {
        ImageRenderer: ImageRendererComponent,
        feedback: null,
        isCurrentMessage,
        isGenerating: inProgress && isCurrentMessage && !!message.content,
        isLoading: inProgress && isCurrentMessage && !message.content,
        markdownTagRenderers,
        message: aiMessage,
        messages,
        rawData: message,
        subComponent: aiMessage.generativeUI?.(),
      };
      return (
        <div className="copilotAssistantWithTools" key={index}>
          <ToolCallStrip message={aiMessage} />
          <div className="copilotAssistantMessageRow">
            <img
              alt="Geodude assistant avatar"
              className="copilotAssistantAvatar"
              draggable="false"
              src={geodudeAvatarUrl}
            />
            <div className="copilotAssistantBubbleWrap">
              <AssistantMessageComponent
                {...assistantProps}
                data-message-role="assistant"
              />
            </div>
          </div>
        </div>
      );
    }
    case "tool":
      return (
        <ToolResultCard
          key={index}
          message={message as ToolResult}
          messages={messages}
        />
      );
    case "activity":
    case "developer":
    case "reasoning":
    case "system":
      return null;
    default:
      return null;
  }
}
