// Bot messages feature exports (plan bot natural, T22)

export {
  BotMessagesPage,
  BOT_MESSAGES_PERMISSION,
} from "./components/BotMessagesPage";
export { BOT_MESSAGES_KEYS, useBotMessages } from "./hooks/useBotMessages";
export type {
  BotMessage,
  BotMessagesCatalog,
  BotMessageStage,
} from "./types/bot-messages.types";
