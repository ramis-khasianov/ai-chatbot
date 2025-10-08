import { streamText } from "ai";
import { sheetPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

export const sheetDocumentHandler = createDocumentHandler<"sheet">({
  kind: "sheet",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { textStream } = streamText({
      model: myProvider.languageModel("artifact-model"),
      system: sheetPrompt,
      prompt: title,
    });

    for await (const textDelta of textStream) {
      draftContent += textDelta;

      dataStream.write({
        type: "data-sheetDelta",
        data: draftContent,
        transient: true,
      });
    }

    dataStream.write({
      type: "data-sheetDelta",
      data: draftContent,
      transient: true,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { textStream } = streamText({
      model: myProvider.languageModel("artifact-model"),
      system: updateDocumentPrompt(document.content, "sheet"),
      prompt: description,
    });

    for await (const textDelta of textStream) {
      draftContent += textDelta;

      dataStream.write({
        type: "data-sheetDelta",
        data: draftContent,
        transient: true,
      });
    }

    return draftContent;
  },
});
