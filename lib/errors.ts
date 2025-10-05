export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "offline";

export type Surface =
  | "chat"
  | "auth"
  | "api"
  | "stream"
  | "database"
  | "history"
  | "vote"
  | "document"
  | "suggestions"
  | "activate_gateway";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: "log",
  chat: "response",
  auth: "response",
  stream: "response",
  api: "response",
  history: "response",
  vote: "response",
  document: "response",
  suggestions: "response",
  activate_gateway: "response",
};

export class ChatSDKError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(":");

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === "log") {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: "", message: "Что-то пошло не так. Пожалуйста, попробуйте позже." },
        { status: statusCode }
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes("database")) {
    return "Произошла ошибка при выполнении запроса к базе данных.";
  }

  switch (errorCode) {
    case "bad_request:api":
      return "Не удалось обработать запрос. Проверьте введенные данные и попробуйте снова.";

    case "bad_request:activate_gateway":
      return "AI Gateway требует привязанную кредитную карту для обработки запросов. Пожалуйста, посетите https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card чтобы добавить карту и разблокировать бесплатные кредиты.";

    case "unauthorized:auth":
      return "Вам необходимо войти в систему для продолжения.";
    case "forbidden:auth":
      return "Ваш аккаунт не имеет доступа к этой функции.";

    case "rate_limit:chat":
      return "Вы превысили максимальное количество сообщений за день. Пожалуйста, попробуйте позже.";
    case "not_found:chat":
      return "Запрошенный чат не найден. Проверьте ID чата и попробуйте снова.";
    case "forbidden:chat":
      return "Этот чат принадлежит другому пользователю. Проверьте ID чата и попробуйте снова.";
    case "unauthorized:chat":
      return "Вам необходимо войти в систему для просмотра этого чата. Пожалуйста, войдите и попробуйте снова.";
    case "offline:chat":
      return "Возникли проблемы с отправкой сообщения. Проверьте подключение к интернету и попробуйте снова.";

    case "not_found:document":
      return "Запрошенный документ не найден. Проверьте ID документа и попробуйте снова.";
    case "forbidden:document":
      return "Этот документ принадлежит другому пользователю. Проверьте ID документа и попробуйте снова.";
    case "unauthorized:document":
      return "Вам необходимо войти в систему для просмотра этого документа. Пожалуйста, войдите и попробуйте снова.";
    case "bad_request:document":
      return "Запрос на создание или обновление документа был некорректным. Проверьте введенные данные и попробуйте снова.";

    default:
      return "Что-то пошло не так. Пожалуйста, попробуйте позже.";
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
