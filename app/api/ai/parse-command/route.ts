import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { parseCommandAiSchema } from "@/lib/ai/schemas";
import { generateGeminiText, isGeminiConfigured } from "@/lib/ai/gemini";
import { parseCommand, type ParsedCommand } from "@/lib/command/parse-command";

const COMMAND_TYPES = `navigate | create-task | create-note | create-reminder | create-bookmark | create-course | create-application | create-transaction | set-focus | music-search | unknown`;

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    void userId;

    const body = await request.json();
    const parsed = parseCommandAiSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const ruleBased = parseCommand(parsed.data.input);
    if (ruleBased.type !== "unknown") {
      return jsonOk({ command: ruleBased, source: "rules" as const });
    }

    if (!isGeminiConfigured()) {
      return jsonOk({ command: ruleBased, source: "rules" as const });
    }

    const prompt = `Parse this Personal OS command into JSON only. No markdown.

Input: "${parsed.data.input}"

Return exactly one JSON object matching these types: ${COMMAND_TYPES}

Examples:
- "task buy milk" -> {"type":"create-task","title":"buy milk"}
- "go notes" -> {"type":"navigate","href":"/notes","label":"Notes"}
- "expense coffee 120" -> {"type":"create-transaction","txType":"EXPENSE","amount":"120","description":"coffee"}
- "learn Rust" -> {"type":"create-course","title":"Rust"}
- "apply Meta at Backend Engineer" -> {"type":"create-application","company":"Meta","role":"Backend Engineer"}
- "focus ship portfolio" -> {"type":"set-focus","focus":"ship portfolio"}
- "play lofi" -> {"type":"music-search","query":"lofi"}
- gibberish -> {"type":"unknown","raw":"..."}`;

    const raw = await generateGeminiText(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return jsonOk({ command: ruleBased, source: "rules" as const });
    }

    const command = JSON.parse(jsonMatch[0]) as ParsedCommand;
    return jsonOk({ command, source: "gemini" as const });
  } catch (error) {
    return handleRouteError(error, "[ai/parse-command]");
  }
}
