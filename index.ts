import { MCPServer } from "mcp-use";
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

type DiagramType = (typeof diagramTypes)[number];

let lastDiagram: {
  title?: string;
  diagram: string;
  diagramType?: DiagramType;
} | null = null;

const server = new MCPServer({
  name: "diagram-builder",
  title: "Diagram Builder",
  version: "1.0.0",
  description: "Interactive diagrams — Mermaid in your chat",
  icons: [
    { src: "icon.svg", mimeType: "image/svg+xml", sizes: ["512x512"] },
  ],
});

const diagramInputSchema = z.object({
  title: z.string().optional().describe("Diagram title"),
  diagram: z.string().describe("Mermaid diagram syntax"),
  diagramType: z.enum(diagramTypes).optional().describe("Diagram type hint"),
});

const diagramOutputSchema = z.object({
  title: z.string().optional(),
  diagram: z.string(),
  diagramType: z.enum(diagramTypes).optional(),
});

export const createDiagram = server.tool(
  {
    name: "create-diagram",
    description:
      "Create an interactive Mermaid diagram. Supports flowchart, sequence, class, state, ER, gantt, pie, mindmap, and timeline diagrams. " +
      "Pass valid Mermaid syntax and the diagram renders live as you stream.",
    inputSchema: diagramInputSchema,
    outputSchema: diagramOutputSchema,
    view: {
      name: "create-diagram-view",
      description: "Interactive Mermaid diagram renderer",
      prefersBorder: true,
    },
  },
  async ({ title, diagram, diagramType }) => {
    lastDiagram = { title, diagram, diagramType };

    const data = { title, diagram, diagramType };
    return {
      content: [{ type: "text", text: `Created ${diagramType ?? "diagram"}${title ? `: ${title}` : ""}` }],
      structuredContent: data,
    };
  }
);

export const editDiagram = server.tool(
  {
    name: "edit-diagram",
    description:
      "Edit the most recent diagram. Provide updated Mermaid syntax to replace the current diagram.",
    inputSchema: diagramInputSchema,
    outputSchema: diagramOutputSchema,
    view: {
      name: "edit-diagram-view",
      description: "Interactive Mermaid diagram renderer for diagram updates",
      prefersBorder: true,
    },
  },
  async ({ title, diagram, diagramType }) => {
    const merged = {
      title: title ?? lastDiagram?.title,
      diagram,
      diagramType: diagramType ?? lastDiagram?.diagramType,
    };
    lastDiagram = merged;

    return {
      content: [{ type: "text", text: `Updated ${merged.diagramType ?? "diagram"}${merged.title ? `: ${merged.title}` : ""}` }],
      structuredContent: merged,
    };
  }
);

export default server;
