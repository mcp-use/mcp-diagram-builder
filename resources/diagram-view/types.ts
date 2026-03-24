import { z } from "zod";

export const propSchema = z.object({
  title: z.string().optional().describe("Diagram title"),
  diagram: z.string().describe("Mermaid diagram syntax"),
  diagramType: z.string().optional().describe("Diagram type hint"),
});

export type DiagramViewProps = z.infer<typeof propSchema>;
