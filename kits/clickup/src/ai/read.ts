import { $ZodObject, toJSONSchema } from "zod/v4/core";
import * as z from "zod/v4-mini";
import { LiveError } from "../core";
import type { LiveBridge } from "../host/bridge";
import type { ArtifactInferConfidence, ArtifactInferQuery } from "../host/wire";
import type { Schema } from "../validate";
import { fromHost } from "../validate";
import type { Classification } from "./ai";

type Json = ArtifactInferQuery["input"];
type JsonSchema = ArtifactInferQuery["output"];
type Answer = Classification["answer"];
type Distribution = ArtifactInferConfidence[string];

const MIN_SCALE_LEVELS = 2;
const MAX_SCALE_LEVELS = 10;

const InferResultSchema = z.object({
  output: z.unknown(),
  confidence: z.optional(
    z.nullable(z.record(z.string(), z.record(z.string(), z.number()))),
  ),
});

/** Asks the evaluation model about `input`, with one answer per item when `input` is an array. */
export async function classify(
  host: LiveBridge,
  input: unknown,
  schema: unknown,
): Promise<Classification | Classification[]> {
  const questions = questionsOf(schema);
  const answers = answersOf(questions);
  const value = toJson(input);
  if (!Array.isArray(value)) {
    const { output, confidence } = await infer(host, {
      input: value,
      output: questions,
      tier: "evaluation",
    });
    return classification(
      fromHost(answers, output, "answers"),
      questions,
      (field) => confidence?.[field],
    );
  }

  const { output, confidence } = await infer(host, {
    input: value,
    output: { type: "array", items: questions },
    tier: "evaluation",
  });
  return fromHost(
    z.array(answers).check(z.length(value.length)),
    output,
    "answers",
  ).map((answer, index) =>
    classification(
      answer,
      questions,
      (field) => confidence?.[`${index}.${field}`],
    ),
  );
}

/** Asks the fast chat model for what `schema` describes, with `prompt` as its only input. */
export async function generate(
  host: LiveBridge,
  prompt: string,
  schema: unknown,
): Promise<Record<string, unknown>> {
  const object = zodObjectOf(schema);
  const { output } = await infer(host, {
    input: prompt,
    output: jsonSchemaOf(object),
    tier: "fast",
  });
  return fromHost(object, output, "output");
}

/** Identifies `schema` in a hook's cache key; an invalid schema is keyed by its error message. */
export function schemaKey(schema: unknown): string {
  try {
    return JSON.stringify(jsonSchemaOf(zodObjectOf(schema)));
  } catch (error) {
    return String(error);
  }
}

/** Identifies `input` in a hook's cache key; input that isn't JSON is keyed as `""`, and the call rejects it. */
export function inputKey(input: unknown): string {
  try {
    return JSON.stringify(input) ?? "";
  } catch {
    return "";
  }
}

async function infer(host: LiveBridge, query: ArtifactInferQuery) {
  return fromHost(
    InferResultSchema,
    await host.query("infer", query),
    "infer result",
  );
}

function classification(
  answer: Answer,
  questions: JsonSchema,
  distributionOf: (field: string) => Distribution | undefined,
): Classification {
  const fields = fieldsOf(questions);
  return {
    answer,
    confidence: Object.fromEntries(
      Object.keys(answer).flatMap((name) => {
        const distribution = distributionOf(name);
        return distribution
          ? [[name, confidenceOf(fields[name]!, distribution)]]
          : [];
      }),
    ),
  };
}

/**
 * TypeSafe's certainty for a field with N possible answers:
 * `(N × top probability − 1) / (N − 1)`, so an even split is 0 and all of the
 * probability on one answer is 1. Rounded to 12 digits to drop binary tails.
 */
function confidenceOf(field: JsonSchema, distribution: Distribution): number {
  const n = answerCount(field);
  if (n < 2) {
    return 1;
  }

  const top = Math.max(...Object.values(distribution));
  const certainty = Math.min(1, Math.max(0, (n * top - 1) / (n - 1)));
  return Number(certainty.toPrecision(12));
}

function answerCount(field: JsonSchema): number {
  if (field.type === "boolean") {
    return 2;
  }
  if (field.type === "integer") {
    return (field.maximum as number) - (field.minimum as number) + 1;
  }
  return (field.enum as unknown[]).length;
}

/** What the model's answers must look like; a scale's answer can fall between its levels. */
function answersOf(questions: JsonSchema): Schema<Answer> {
  return z.object(
    Object.fromEntries(
      Object.entries(fieldsOf(questions)).map(([name, field]) => [
        name,
        field.type === "boolean"
          ? z.boolean()
          : field.type === "integer"
            ? z
                .number()
                .check(
                  z.gte(field.minimum as number),
                  z.lte(field.maximum as number),
                )
            : z.enum(field.enum as [string, ...string[]]),
      ]),
    ),
  ) as Schema<Answer>;
}

/** Converts a `classify` schema to JSON Schema, and rejects it unless every field is a required, described boolean, enum or scale. */
function questionsOf(schema: unknown): JsonSchema {
  const json = jsonSchemaOf(zodObjectOf(schema));
  const fields = fieldsOf(json);
  const required = new Set(json.required as string[] | undefined);
  const names = Object.keys(fields);
  if (names.length === 0) {
    throw new LiveError("invalid", "Give classify at least one field.");
  }

  const wrong = names.filter(
    (name) => !required.has(name) || !isQuestion(fields[name]!),
  );
  if (wrong.length > 0) {
    throw new LiveError(
      "invalid",
      `Make ${wrong.join(", ")} a required z.boolean(), z.enum([...]) or z.number().int().min(a).max(b) with 2 to 10 levels, with the question in .describe().`,
    );
  }

  return json;
}

function fieldsOf(json: JsonSchema): Record<string, JsonSchema> {
  return (json.properties ?? {}) as Record<string, JsonSchema>;
}

function isQuestion(field: JsonSchema): boolean {
  return (
    typeof field.description === "string" &&
    field.description.trim() !== "" &&
    (field.type === "boolean" ||
      (field.type === "string" && Array.isArray(field.enum)) ||
      isScale(field))
  );
}

function isScale({ type, minimum, maximum }: JsonSchema): boolean {
  if (
    type !== "integer" ||
    typeof minimum !== "number" ||
    typeof maximum !== "number" ||
    !Number.isInteger(minimum) ||
    !Number.isInteger(maximum)
  ) {
    return false;
  }

  const levels = maximum - minimum + 1;
  return levels >= MIN_SCALE_LEVELS && levels <= MAX_SCALE_LEVELS;
}

function zodObjectOf(schema: unknown): $ZodObject {
  if (!(schema instanceof $ZodObject)) {
    throw new LiveError(
      "invalid",
      'Pass a z.object() schema from zod 4, `import { z } from "zod"`.',
    );
  }

  return schema;
}

const jsonSchemas = new WeakMap<object, JsonSchema>();

/** Converts an object schema to the JSON Schema the model answers to, once per schema. */
function jsonSchemaOf(schema: $ZodObject): JsonSchema {
  let json = jsonSchemas.get(schema);
  if (!json) {
    json = toJsonSchema(schema);
    jsonSchemas.set(schema, json);
  }
  return json;
}

function toJsonSchema(schema: $ZodObject): JsonSchema {
  try {
    const { $schema, ...json } = toJSONSchema(schema);
    return json as JsonSchema;
  } catch (error) {
    throw new LiveError(
      "invalid",
      `The schema can't be sent to the model: ${error instanceof Error ? error.message : String(error)}.`,
    );
  }
}

/** Round-trips `value` through JSON, so `undefined` fields drop out and dates become strings. */
function toJson(value: unknown): Json {
  const text = inputKey(value);
  if (text === "") {
    throw new LiveError(
      "invalid",
      "The input must be plain JSON data: no undefined, functions, BigInts or circular references.",
    );
  }

  return JSON.parse(text) as Json;
}
