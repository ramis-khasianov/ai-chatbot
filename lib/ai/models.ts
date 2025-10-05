export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Grok Vision",
    description: "Продвинутая мультимодальная модель с возможностями обработки изображений и текста",
  },
  {
    id: "chat-model-reasoning",
    name: "Grok Reasoning",
    description:
      "Использует продвинутое цепочное рассуждение для решения сложных задач",
  },
];
