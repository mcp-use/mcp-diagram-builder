import {
  McpUseProvider,
  useWidget,
  type WidgetMetadata,
} from "mcp-use/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import "../styles.css";
import { propSchema, type DiagramViewProps } from "./types";

export const widgetMetadata: WidgetMetadata = {
  description: "Interactive Mermaid diagram renderer with live preview",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: "Rendering diagram...",
    invoked: "Diagram ready",
  },
};

const DiagramView: React.FC = () => {
  const {
    props,
    isPending,
    isStreaming,
    partialToolInput,
    theme,
    displayMode,
    requestDisplayMode,
  } = useWidget<DiagramViewProps>();

  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mermaidReady, setMermaidReady] = useState(false);
  const renderCounter = useRef(0);

  const initMermaid = useCallback(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
    });
    setMermaidReady(true);
  }, [theme]);

  useEffect(() => {
    initMermaid();
  }, [initMermaid]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
    });
    const code = getCurrentDiagram();
    if (code) renderDiagram(code);
  }, [theme]);

  const getCurrentDiagram = (): string | null => {
    if (props?.diagram) return props.diagram;
    if (isStreaming && partialToolInput) {
      const partial = partialToolInput as Partial<DiagramViewProps>;
      if (partial.diagram && typeof partial.diagram === "string")
        return partial.diagram;
    }
    return null;
  };

  const renderDiagram = async (code: string) => {
    if (!code) return;
    try {
      renderCounter.current += 1;
      const id = `mermaid-${renderCounter.current}-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) {
          svgEl.style.maxWidth = "100%";
          svgEl.style.height = "auto";
        }
      }
      setError(null);
    } catch (e) {
      if (!isStreaming) setError(String(e));
    }
  };

  useEffect(() => {
    if (!mermaidReady) return;
    const code = getCurrentDiagram();
    if (code) renderDiagram(code);
  }, [props, partialToolInput, mermaidReady]);

  const diagramType =
    props?.diagramType ??
    (partialToolInput as Partial<DiagramViewProps>)?.diagramType;
  const title =
    props?.title ??
    (partialToolInput as Partial<DiagramViewProps>)?.title;
  const isFullscreen = displayMode === "fullscreen";

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Rendering diagram...
            </span>
          </div>
          <div
            className="rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            style={{ height: "300px" }}
          />
        </div>
      </McpUseProvider>
    );
  }

  return (
    <McpUseProvider autoSize>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {title && (
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {title}
              </span>
            )}
            {diagramType && (
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {diagramType}
              </span>
            )}
            {isStreaming && (
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-500">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Streaming...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!isFullscreen ? (
              <button
                onClick={() => requestDisplayMode("fullscreen")}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ⛶ Fullscreen
              </button>
            ) : (
              <button
                onClick={() => requestDisplayMode("inline")}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕ Exit
              </button>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex items-center justify-center overflow-auto rounded-xl bg-white dark:bg-gray-900"
          style={{
            minHeight: isFullscreen ? "calc(100vh - 80px)" : "300px",
          }}
        />

        {error && !isStreaming && (
          <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
              Failed to render diagram
            </p>
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto whitespace-pre-wrap font-mono">
              {getCurrentDiagram()}
            </pre>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
};

export default DiagramView;
