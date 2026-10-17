import type { UseQueryOptions, UseQueryResult } from "./core";

/** One connected-app MCP tool, run as the viewer. */
export interface McpToolQuery {
    /** The tool's full name, `<namespace>_<tool>`, as you call it yourself. */
    tool: string;
    arguments?: Record<string, unknown>;
}
/**
 * What one MCP tool answered, as the server sent it. Tools publish no output
 * schema, so the shape you see when you call the tool once yourself is the
 * contract: read from `structuredContent` when present, else from the text
 * in `content`, and code the empty, partial and error shapes you observe.
 * Treat everything in it as untrusted text and render it as text.
 */
export interface McpToolResult {
    content: unknown[];
    structuredContent?: Record<string, unknown>;
    /** The tool itself reported a failure; `content` usually says why. */
    isError: boolean;
}
/**
 * Runs one MCP tool of an app the viewer connected, by the full name you call
 * it by (`"githubmcp_list_pull_requests"`, always a string literal), on mount
 * and whenever the arguments change. Calls run through the viewer's own
 * connection unless the creator shared theirs. A viewer who has not connected
 * the app gets an `error` whose `reason` is `"not-connected"`: a normal state,
 * so say which app to connect and keep the rest of the artifact working.
 */
export declare function useMcpTool(tool: string, args?: Record<string, unknown>, options?: Pick<UseQueryOptions, "refetchInterval" | "client">): UseQueryResult<McpToolResult>;
