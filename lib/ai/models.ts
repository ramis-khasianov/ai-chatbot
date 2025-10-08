export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: process.env.CHAT_MODEL_TITLE || "Qwen3 32B",
    description: "Быстрая модель без режима размышлений",
  },
  {
    id: "chat-model-reasoning",
    name: process.env.REASONING_MODEL_TITLE || "Qwen3 32B Thinking",
    description: "Модель с углубленным режимом размышлений для сложных задач",
  },
];
