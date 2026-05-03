import { Header, BottomNav } from "@/components/layout";
import {
  ProactiveCard,
  SuggestedPrompts,
  UserMessage,
  CopilotMessage,
  ChatInput,
} from "@/components/copilot";
import { mockCopilotState } from "@/data";

/**
 * Copilot — interfaccia conversazionale con l'AI coach.
 *
 * Anatomia (top → bottom):
 *
 *   1. Header con avatar + titolo "Copilot" + settings.
 *   2. Card proattiva (analisi mattutina) — accent viola.
 *   3. Carousel di prompt suggeriti (chip orizzontali).
 *   4. Storico chat: alternanza UserMessage / CopilotMessage.
 *   5. ChatInput floating fissato in basso (sopra la BottomNav).
 *
 * Identità cromatica: il viola è riservato a tutto ciò che è AI-generato
 * (avatar, send button, proactive card). Vedi DESIGN.md §Components.
 *
 * UI statica: i messaggi vengono dal mock `mockCopilotState.messages`.
 */
export default function Copilot() {
  const { proactive, suggestedPrompts, messages } = mockCopilotState;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Copilot" showAvatar trailingIcon="settings" />

      <main
        className={[
          "flex-1 px-container-padding pt-24 pb-44",
          "flex flex-col gap-6 max-w-2xl mx-auto w-full",
        ].join(" ")}
      >
        <ProactiveCard label={proactive.label} icon={proactive.icon}>
          {proactive.body}
        </ProactiveCard>

        <SuggestedPrompts prompts={suggestedPrompts} />

        <div className="flex flex-col gap-6 mt-2">
          {messages.map((m) =>
            m.role === "user" ? (
              <UserMessage key={m.id}>{m.content}</UserMessage>
            ) : (
              <CopilotMessage key={m.id}>{m.content}</CopilotMessage>
            ),
          )}
        </div>
      </main>

      <ChatInput placeholder="Chiedimi qualsiasi cosa..." />
      <BottomNav active="copilot" />
    </div>
  );
}
