import { getUserId } from "@/lib/auth/user";
import { handleRouteError } from "@/lib/api/handle-route-error";
import { jsonError, jsonOk } from "@/lib/api/response";
import { briefPromptFromContext, buildBriefContext } from "@/lib/ai/build-brief-context";
import { generateGeminiText, isGeminiConfigured } from "@/lib/ai/gemini";
import { canGenerateBrief, markBriefGenerated } from "@/lib/ai/rate-limit";
import { prisma, withPrismaRetry } from "@/lib/prisma/client";

export async function POST() {
  try {
    if (!isGeminiConfigured()) {
      return jsonError(
        "AI is not configured. Add GEMINI_API_KEY to your environment.",
        503,
      );
    }

    const userId = await getUserId();
    const limit = canGenerateBrief(userId);
    if (!limit.ok) {
      return jsonError(`Please wait ${limit.retryAfterSec}s before generating another brief`, 429);
    }

    const ctx = await buildBriefContext(userId);
    const prompt = briefPromptFromContext(ctx);
    const content = await generateGeminiText(prompt);

    const brief = await withPrismaRetry(() =>
      prisma.aiBrief.create({
        data: { userId, content },
      }),
    );

    markBriefGenerated(userId);

    return jsonOk({
      brief: {
        id: brief.id,
        content: brief.content,
        createdAt: brief.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, "[ai/today-brief]");
  }
}
