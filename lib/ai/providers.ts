import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Configure your OpenAI-compatible API endpoint
// This can be OpenAI, Ollama, LM Studio, vLLM, or any OpenAI-compatible API
const openai = createOpenAICompatible({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY || "local",
  name: "openai-compatible"
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // Main chat model - use your preferred model
        "chat-model": openai(
          process.env.CHAT_MODEL || "gpt-4o"
        ),
        // Reasoning model with chain-of-thought
        "chat-model-reasoning": wrapLanguageModel({
          model: openai(
            process.env.REASONING_MODEL || "gpt-4o"
          ),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        // Model for generating titles
        "title-model": openai(
          process.env.TITLE_MODEL || "gpt-4o-mini"
        ),
        // Model for artifacts/documents
        "artifact-model": openai(
          process.env.ARTIFACT_MODEL || "gpt-4o"
        ),
      },
    });
