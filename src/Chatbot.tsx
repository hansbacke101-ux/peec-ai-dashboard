import { CopilotChat } from "@copilotkit/react-ui";
import { useState } from "react";

const instructions = [
  "You are the GoGeo dashboard copilot, powered by Peec AI.",
  "Answer concisely and use dashboard actions when the user asks to change",
  "the page, inspect a company, focus a metric, sort brands, or compare",
  "companies.",
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
