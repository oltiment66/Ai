import type { UseQueryOptions, UseQueryResult } from "./core";

/** A `z.object({ ... })` schema. */
export interface ZodObject {
    parse(value: unknown): unknown;
}
/** What `classify` returns for one input. */
export interface Classification {
    /** The answer to each question. */
    answer: Record<string, boolean | string | number>;
    /** How sure the model is of each answer: 0 means it couldn't tell, 1 means certain. */
    confidence: Record<string, number>;
}
export interface AiApi {
    /**
     * Answers questions about `input` with a fast, cheap decision model. It is not an LLM: it can't write text or follow instructions.
     * Each field in `schema` is one question, written in `.describe()`:
     * - `z.boolean()`: yes or no
     * - `z.enum([...])`: pick one option
     * - `z.number().int().min(1).max(5)`: a scale of 2 to 10 steps; say what the ends mean. Answers can fall between steps, like 3.5.
     *
     * Ask one thing per question. Pass an array to get one answer per item.
     * @example
     * const triage = z.object({
     *   urgent: z.boolean().describe("Does this need attention today?"),
     *   area: z.enum(["billing", "bug", "other"]).describe("What is it about?"),
     * });
     * const [first] = await clickup.ai.classify(["Charged twice", "App crashes"], triage);
     * first.answer.area; // "billing"
     */
    classify(input: unknown[], schema: ZodObject): Promise<Classification[]>;
    classify(input: unknown, schema: ZodObject): Promise<Classification>;
    /**
     * Asks an LLM to write or extract text, such as a summary, a draft or fields from a document, and returns an object matching `schema`. Put everything the model needs in `prompt`.
     * @example
     * const { summary } = await clickup.ai.generate(
     *   `Summarize this sprint in three sentences: ${JSON.stringify(tasks)}`,
     *   z.object({ summary: z.string() }),
     * );
     */
    generate(prompt: string, schema: ZodObject): Promise<Record<string, unknown>>;
    /** Sends `prompt` to Brain, ClickUp's AI assistant, as the viewer once they approve. Brain answers in a chat beside the artifact; nothing comes back here. */
    askBrain(prompt: string): Promise<void>;
}
/** `clickup.ai.classify` as a hook: each input, or each item of a list, is asked about once per schema; `refetch()` asks again. */
export declare function useClassify(input: unknown[], schema: ZodObject, options?: UseQueryOptions<Classification[]>): UseQueryResult<Classification[]>;
export declare function useClassify(input: unknown, schema: ZodObject, options?: UseQueryOptions<Classification>): UseQueryResult<Classification>;
/** `clickup.ai.generate` as a hook, asked once per prompt and schema; `refetch()` asks again. */
export declare function useGenerate(prompt: string, schema: ZodObject, options?: UseQueryOptions<Record<string, unknown>>): UseQueryResult<Record<string, unknown>>;
