import { useDisplayMode, useToolContext, useViewTheme } from "mcp-use/react";
import { useCallback, useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import "./view.css";

export function DiagramRenderer() {
  const view = useToolContext<"create-diagram" | "edit-diagram">();
  const theme = useViewTheme();
  const { displayMode, availableDisplayModes, requestDisplayMode } = useDisplayMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const renderCounter = useRef(0);
  const diagram = view.toolOutput?.diagram;

  const renderDiagram = useCallback(async (code: string) => {
    try {
      renderCounter.current += 1;
      const id = `mermaid-${renderCounter.current}-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        const svgElement = containerRef.current.querySelector("svg");
        if (svgElement) {
          svgElement.style.maxWidth = "100%";
          svgElement.style.height = "auto";
        }
      }
      setError(null);
    } catch (renderError) {
      setError(String(renderError));
    }
  }, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === "dark" ? "dark" : "default",
      securityLevel: "loose",
    });
    if (diagram) void renderDiagram(diagram);
  }, [diagram, renderDiagram, theme]);

  if (view.status === "pending") {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Rendering diagram...</span>
        </div>
        <div className="rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ height: "300px" }} />
      </div>
    );
  }

  if (view.status === "error") {
    return <p role="alert" className="p-4 text-red-600">{view.error.message}</p>;
  }

  const { title, diagramType } = view.toolOutput;
  const isFullscreen = displayMode === "fullscreen";
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {title && <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{title}</span>}
          {diagramType && <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{diagramType}</span>}
        </div>
        {availableDisplayModes.includes(isFullscreen ? "inline" : "fullscreen") && (
          <button
            type="button"
            onClick={() => void requestDisplayMode({ mode: isFullscreen ? "inline" : "fullscreen" })}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}
          </button>
        )}
      </div>
      <div ref={containerRef} className="flex items-center justify-center overflow-auto rounded-xl bg-white dark:bg-gray-900" style={{ minHeight: isFullscreen ? "calc(100vh - 80px)" : "300px" }} />
      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">Failed to render diagram</p>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto whitespace-pre-wrap font-mono">{diagram}</pre>
        </div>
      )}
    </div>
  );
}
