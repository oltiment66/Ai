import { useCallback, useRef } from "react";
import { clickup } from "../client";
import type { LiveClient, UseQueryOptions, UseQueryResult } from "../core";
import type { Store } from "../store";
import { useLiveQuery } from "../useQuery";
import { inputKey, schemaKey } from "./read";

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
export function useClassify(
  input: unknown[],
  schema: ZodObject,
  options?: UseQueryOptions<Classification[]>,
): UseQueryResult<Classification[]>;
export function useClassify(
  input: unknown,
  schema: ZodObject,
  options?: UseQueryOptions<Classification>,
): UseQueryResult<Classification>;
export function useClassify<T>(
  input: unknown,
  schema: ZodObject,
  options: UseQueryOptions<T> = {},
): UseQueryResult<T> {
  const { store } = options.client ?? clickup;
  const latest = useRef({ input, schema });
  latest.current = { input, schema };
  const query = useLiveQuery(
    "infer",
    { classify: inputKey(input), schema: schemaKey(schema) },
    async (client) =>
      (Array.isArray(input)
        ? await classifyEach(client, input, schema)
        : await client.ai.classify(input, schema)) as T,
    answerOnce(options),
    { once: true },
  );
  const { refetch } = query;
  const askAgain = useCallback(() => {
    const { input, schema } = latest.current;
    if (Array.isArray(input)) {
      forget(store, input, schema);
    }
    return refetch();
  }, [store, refetch]);
  return { ...query, refetch: askAgain };
}

/** `clickup.ai.generate` as a hook, asked once per prompt and schema; `refetch()` asks again. */
export function useGenerate(
  prompt: string,
  schema: ZodObject,
  options: UseQueryOptions<Record<string, unknown>> = {},
): UseQueryResult<Record<string, unknown>> {
  return useLiveQuery(
    "infer",
    { generate: prompt, schema: schemaKey(schema) },
    (client) => client.ai.generate(prompt, schema),
    answerOnce(options),
    { once: true },
  );
}

/** A model's answer is never saved to the cache or refetched on a timer. */
function answerOnce<T>(options: UseQueryOptions<T>): UseQueryOptions<T> {
  return { ...options, cache: false, refetchInterval: undefined };
}

/** Each store's classification of every list item it has asked about, by item and schema, for this session only. */
const itemAnswers = new WeakMap<Store, Map<string, Promise<Classification>>>();

function answersIn(store: Store): Map<string, Promise<Classification>> {
  let answers = itemAnswers.get(store);
  if (!answers) {
    answers = new Map();
    itemAnswers.set(store, answers);
  }
  return answers;
}

function itemKeys(items: unknown[], schema: ZodObject): string[] {
  const schemaId = schemaKey(schema);
  return items.map((item) => `${schemaId}\n${inputKey(item)}`);
}

/** Classifies `items` in input order, sending only the ones not yet asked about with `schema` to the model, in one request; an empty list asks nothing. */
async function classifyEach(
  client: LiveClient,
  items: unknown[],
  schema: ZodObject,
): Promise<Classification[]> {
  const answers = answersIn(client.store);
  const keys = itemKeys(items, schema);
  const unasked = new Map<string, unknown>();
  keys.forEach((key, index) => {
    if (!answers.has(key) && !unasked.has(key)) {
      unasked.set(key, items[index]);
    }
  });
  if (unasked.size > 0) {
    const batch = client.ai.classify([...unasked.values()], schema);
    [...unasked.keys()].forEach((key, index) => {
      const answer = batch.then((results) => results[index]!);
      answers.set(key, answer);
      answer.catch(() => {
        if (answers.get(key) === answer) {
          answers.delete(key);
        }
      });
    });
  }
  return Promise.all(keys.map((key) => answers.get(key)!));
}

function forget(store: Store, items: unknown[], schema: ZodObject): void {
  const answers = answersIn(store);
  for (const key of itemKeys(items, schema)) {
    answers.delete(key);
  }
}
