import { useEffect, useRef, useState } from "react";
import {
  useSendChatMessage,
  useListAiConversations,
  getAiConversation,
  getListAiConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiErrorMessage } from "@/lib/api-error";
import { Send, Loader2, Bot, User, Plus, MessageSquare, Sprout, Star } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I improve maize yield in sandy soil?",
  "What causes yellowing leaves on tomato plants?",
  "When is the best time to plant cassava in Kaduna?",
  "How can I control fall armyworm naturally?",
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useSendChatMessage();
  const { data: conversations } = useListAiConversations();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    send.mutate(
      { data: { message: trimmed, conversationId } },
      {
        onSuccess: (res) => {
          setConversationId(res.conversationId);
          setMessages(res.messages as ChatMessage[]);
          queryClient.invalidateQueries({ queryKey: getListAiConversationsQueryKey() });
        },
        onError: (err) => {
          setMessages((prev) => prev.slice(0, -1));
          const msg = apiErrorMessage(err, "The AI assistant is unavailable right now. Please try again.");
          const isLimitHit = msg.includes("upgrade to AgroGuard Premium");
          
          toast({
            title: "Message failed",
            description: msg,
            variant: "destructive",
            action: isLimitHit ? (
              <ToastAction 
                altText="Upgrade to Premium" 
                onClick={async () => {
                  try {
                    const res = await fetch("/api/farmers/me/upgrade", { method: "POST" });
                    if (!res.ok) throw new Error();
                    toast({ title: "Welcome to Premium!", description: "You now have unlimited AI access. Try your message again!" });
                  } catch {
                    toast({ title: "Upgrade failed", variant: "destructive" });
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white border-none mt-2 sm:mt-0"
              >
                <Star className="h-4 w-4 mr-2" /> Upgrade
              </ToastAction>
            ) : undefined
          });
        },
      },
    );
  };

  const startNew = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  };

  const openConversation = async (id: number) => {
    try {
      const conv = await getAiConversation(id);
      setConversationId(conv.id);
      setMessages(conv.messages as ChatMessage[]);
    } catch {
      toast({ title: "Could not load conversation", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Farming Assistant</h2>
        <p className="text-muted-foreground">
          Ask anything about crops, soil, pests, irrigation, and farm management.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Conversation history */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={startNew}>
            <Plus className="mr-2 h-4 w-4" /> New conversation
          </Button>
          <div className="space-y-1">
            {conversations?.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  c.id === conversationId ? "bg-muted font-medium" : "text-muted-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
            {!conversations?.length && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No conversations yet.</p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <Card className="flex flex-col h-[calc(100vh-16rem)] min-h-[420px]">
          <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Sprout className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">How can I help with your farm today?</p>
                    <p className="text-sm text-muted-foreground">Pick a question or type your own below.</p>
                  </div>
                  <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="rounded-lg border bg-card p-3 text-left text-sm hover:border-primary/40 hover:bg-muted/50 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {send.isPending && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="rounded-lg bg-muted px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-end gap-2 border-t pt-4"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(input);
                  }
                }}
                placeholder="Ask about your crops, soil, pests..."
                rows={1}
                className="min-h-[44px] max-h-32 resize-none"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || send.isPending}>
                {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
