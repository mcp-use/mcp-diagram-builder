import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";

const diagramTypes = [
  "flowchart",
  "sequence",
  "class",
  "state",
  "er",
  "gantt",
  "pie",
  "mindmap",
  "timeline",
] as const;

let lastDiagram: { title?: string; diagram: string; diagramType?: string } | null = null;

const server = new MCPServer({
  name: "diagram-builder",
  title: "Diagram Builder",
  version: "1.0.0",
  description: "Interactive diagrams — Mermaid in your chat",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  icons: [
    { src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] },
  ],
});

server.tool(
  {
    name: "create-diagram",
    description:
      "Create an interactive Mermaid diagram. Supports flowchart, sequence, class, state, ER, gantt, pie, mindmap, and timeline diagrams. " +
      "Pass valid Mermaid syntax and the diagram renders live as you stream.",
    schema: z.object({
      title: z.string().optional().describe("Diagram title"),
      diagram: z.string().describe("Mermaid diagram syntax"),
      diagramType: z
        .enum(diagramTypes)
        .optional()
        .describe("Diagram type hint"),
    }),
    widget: {
      name: "diagram-view",
      invoking: "Rendering diagram...",
      invoked: "Diagram ready",
    },
  },
  async ({ title, diagram, diagramType }) => {
    lastDiagram = { title, diagram, diagramType };

    return widget({
      props: { title, diagram, diagramType },
      output: text(
        `Created ${diagramType ?? "diagram"}${title ? `: ${title}` : ""}`
      ),
    });
  }
);

server.tool(
  {
    name: "edit-diagram",
    description:
      "Edit the most recent diagram. Provide updated Mermaid syntax to replace the current diagram.",
    schema: z.object({
      title: z.string().optional().describe("Updated diagram title"),
      diagram: z.string().describe("Updated Mermaid diagram syntax"),
      diagramType: z
        .enum(diagramTypes)
        .optional()
        .describe("Diagram type hint"),
    }),
    widget: {
      name: "diagram-view",
      invoking: "Updating diagram...",
      invoked: "Diagram updated",
    },
  },
  async ({ title, diagram, diagramType }) => {
    const merged = {
      title: title ?? lastDiagram?.title,
      diagram,
      diagramType: diagramType ?? lastDiagram?.diagramType,
    };
    lastDiagram = merged;

    return widget({
      props: merged,
      output: text(
        `Updated ${merged.diagramType ?? "diagram"}${merged.title ? `: ${merged.title}` : ""}`
      ),
    });
  }
);

server.listen().then(() => console.log("Diagram Builder running"));
