import { Markdown, useChatContext } from "@copilotkit/react-ui";
import type { AssistantMessageProps } from "@copilotkit/react-ui";

/**
 * Like CopilotKit’s default assistant bubble, but without the message action
 * row (regenerate, copy, thumbs).
 */
export function AssistantMessageNoControls(
  props: AssistantMessageProps,
) {
  const { icons } = useChatContext();
  const { message, isLoading, markdownTagRenderers } = props;
  const content = message?.content || "";
  const subComponent =
    message?.generativeUI?.() ?? props.subComponent;
  const subComponentPosition = message?.generativeUIPosition ?? "after";
  const renderBefore = subComponent && subComponentPosition === "before";
  const renderAfter = subComponent && subComponentPosition !== "before";
  const LoadingIcon = () => <span>{icons.activityIcon}</span>;

  return (
    <>
      {renderBefore ? (
        <div style={{ marginBottom: "0.5rem" }}>{subComponent}</div>
      ) : null}
      {content ? (
        <div className="copilotKitMessage copilotKitAssistantMessage">
          <Markdown
            content={content}
            components={markdownTagRenderers}
          />
        </div>
      ) : null}
      {renderAfter ? (
        <div style={{ marginBottom: "0.5rem" }}>{subComponent}</div>
      ) : null}
      {isLoading ? <LoadingIcon /> : null}
    </>
  );
}
