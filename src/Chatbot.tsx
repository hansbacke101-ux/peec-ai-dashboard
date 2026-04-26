import { CopilotChat } from "@copilotkit/react-ui";
import { useState } from "react";
import { CopilotRenderMessage } from "./CopilotRenderMessage";

const instructions = [
  "You are the GoGeo dashboard copilot, powered by Peec AI.",
  "Prefer fetching answers with Peec AI MCP read tools on the server for",
  "metrics, brands, tags, and other Peec data instead of guessing.",
  "Answer concisely; use dashboard actions when the user asks to change the",
  "page, inspect a company, focus a metric, sort brands, or compare",
  "companies.",
  "On the main overview: showLineChart with xLabels and series: multiple",
  "{ label, values } for multi-line trends; or pie / vertical bar tools.",
].join(" ");

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`chatDock ${isOpen ? "isOpen" : "isCollapsed"}`}>
      <button
        aria-expanded={isOpen}
        className="chatToggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? "Close" : "Ask GoGeo"}
      </button>

      <aside aria-hidden={!isOpen} className="chatPanel">
        {isOpen ? (
          <CopilotChat
            className="copilotChat"
            instructions={instructions}
            RenderMessage={CopilotRenderMessage}
            labels={{
              initial: "Ask me about Peec metrics or change this dashboard.",
              placeholder: "Ask about visibility, sentiment, competitors...",
              title: "GoGeo Copilot",
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}
