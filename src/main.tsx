import React from "react";
import { CopilotKit } from "@copilotkit/react-core";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@copilotkit/react-ui/styles.css";
import "./styles.css";

function pinCopilotInspectorBottomLeft() {
  type InspectorElement = HTMLElement & {
    activeContext?: string;
    announcementTimestamp?: string | null;
    fetchAnnouncement?: () => Promise<void>;
    hasUnseenAnnouncement?: boolean;
    requestUpdate?: () => void;
    showAnnouncementPreview?: boolean;
    updateHostTransform?: (context?: string) => void;
  };

  const storageKey = "cpk:inspector:state";
  const announcementStorageKey = "cpk:inspector:announcements";
  const hideAnnouncement = (element: InspectorElement) => {
    element.hasUnseenAnnouncement = false;
    element.showAnnouncementPreview = false;

    if (element.announcementTimestamp) {
      const payload = JSON.stringify({
        timestamp: element.announcementTimestamp,
      });

      localStorage.setItem(announcementStorageKey, payload);
    }

    element.requestUpdate?.();
  };
  const pinElement = (element: InspectorElement) => {
    element.style.setProperty("bottom", "16px", "important");
    element.style.setProperty("left", "16px", "important");
    element.style.setProperty("right", "auto", "important");
    element.style.setProperty("top", "auto", "important");
    element.style.setProperty("transform", "none", "important");
  };
  const pinExistingElement = () => {
    const element =
      document.querySelector<InspectorElement>("cpk-web-inspector");

    if (element) {
      hideAnnouncement(element);
      pinElement(element);
    }
  };
  const nextState = {
    button: {
      anchor: { horizontal: "left", vertical: "bottom" },
      anchorOffset: { x: 16, y: 16 },
      hasCustomPosition: false,
    },
    dockMode: "floating",
    isOpen: false,
    window: {
      anchor: { horizontal: "left", vertical: "bottom" },
      anchorOffset: { x: 16, y: 16 },
      hasCustomPosition: false,
      size: { height: 560, width: 840 },
    },
  };

  localStorage.removeItem("cpk:inspector:hidden");
  localStorage.setItem(storageKey, JSON.stringify(nextState));

  customElements.whenDefined("cpk-web-inspector").then(() => {
    const constructor = customElements.get("cpk-web-inspector");
    const prototype = constructor?.prototype as InspectorElement | undefined;
    const originalFetch = prototype?.fetchAnnouncement;
    const originalUpdate = prototype?.updateHostTransform;

    if (!prototype || !originalUpdate) {
      return;
    }

    if (originalFetch) {
      prototype.fetchAnnouncement = async function fetchAnnouncement() {
        await originalFetch.call(this);
        hideAnnouncement(this);
      };
    }

    prototype.updateHostTransform = function updateHostTransform(context) {
      originalUpdate.call(this, context);

      if ((context ?? this.activeContext) === "button") {
        pinElement(this);
      }
    };

    pinExistingElement();
  });

  new MutationObserver(pinExistingElement).observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  window.addEventListener("resize", pinExistingElement);
  requestAnimationFrame(pinExistingElement);
}

pinCopilotInspectorBottomLeft();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CopilotKit
      enableInspector
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
    >
      <App />
    </CopilotKit>
  </React.StrictMode>,
);
