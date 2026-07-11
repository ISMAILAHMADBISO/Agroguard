import { useEffect, useRef, useState } from "react";
import {
  useSendChatMessage,
  useListAiConversations,
  getAiConversation,
  getListAiConversationsQueryKey,
  useGetFarmer,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiErrorMessage } from "@/lib/api-error";
import { Send, Loader2, Bot, User, Plus, MessageSquare, Sprout, Star, Edit2, RefreshCw, Copy, Check } from "lucide-react";
import { openPricingModal } from "@/components/pricing-modal";
import ReactMarkdown from "react-markdown";

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
  const { user } = useAuth();
  const { data: farmer } = useGetFarmer(user?.id ?? 0, { query: { enabled: user?.userType === "farmer" } });
  
  const remainingChats = farmer && farmer.subscriptionPlan === "free" ? Math.max(0, 5 - (farmer.aiChatUsageCount ?? 0)) : null;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditValue(content);
  };

  const submitEdit = (index: number) => {
    if (!editValue.trim() || send.isPending) return;
    const truncatedHistory = messages.slice(0, index);
    setMessages([...truncatedHistory, { role: "user", content: editValue.trim() }]);
    setEditingIndex(null);

    send.mutate(
      { data: { message: editValue.trim(), conversationId, history: truncatedHistory } },
      {
        onSuccess: (res) => {
          setConversationId(res.conversationId);
          setMessages(res.messages as ChatMessage[]);
          queryClient.invalidateQueries({ queryKey: getListAiConversationsQueryKey() });
        },
        onError: (err) => handleChatError(err, truncatedHistory),
      }
    );
  };

  const regenerate = (index: number) => {
    if (send.isPending) return;
    const userMessageIndex = index - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== "user") return;
    
    const userMessage = messages[userMessageIndex].content;
    const truncatedHistory = messages.slice(0, userMessageIndex);
    setMessages([...truncatedHistory, { role: "user", content: userMessage }]);
    
    send.mutate(
      { data: { message: userMessage, conversationId, history: truncatedHistory } },
      {
        onSuccess: (res) => {
          setConversationId(res.conversationId);
          setMessages(res.messages as ChatMessage[]);
        },
        onError: (err) => handleChatError(err, truncatedHistory),
      }
    );
  };

  const handleChatError = (err: any, fallbackHistory: ChatMessage[]) => {
    setMessages(fallbackHistory);
    const msg = apiErrorMessage(err, "The AI assistant is unavailable right now. Please try again.");
    const isLimitHit = msg.includes("upgrade to AgroGuard Premium");
    
    toast({
      title: "Message failed",
      description: msg,
      variant: "destructive",
      action: isLimitHit ? (
        <ToastAction 
          altText="View Plans" 
          onClick={openPricingModal}
          className="bg-amber-500 hover:bg-amber-600 text-white border-none mt-2 sm:mt-0"
        >
          <Star className="h-4 w-4 mr-2" /> View Plans
        </ToastAction>
      ) : undefined
    });
  };

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;

    const prevMessages = [...messages];
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
        onError: (err) => handleChatError(err, [...prevMessages]),
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Farming Assistant</h2>
          <p className="text-muted-foreground">
            Ask anything about crops, soil, pests, irrigation, and farm management.
          </p>
        </div>
        {remainingChats !== null && (
          <div className="bg-amber-500/10 border border-amber-200 text-amber-800 rounded-lg px-4 py-2 flex items-center gap-3 text-sm shrink-0">
            <div>
              <span className="font-bold">{remainingChats} of 5</span> free chats remaining today
            </div>
            <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white" onClick={openPricingModal}>
              <Star className="h-3.5 w-3.5 mr-1.5" /> Upgrade
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Conversation history */}
        <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[420px]">
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <Button variant="outline" className="w-full justify-start shrink-0" onClick={startNew}>
              <Plus className="mr-2 h-4 w-4" /> New conversation
            </Button>
            <div className="space-y-1 overflow-y-auto flex-1 pr-2">
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
          
          {farmer?.subscriptionPlan === "free" && (
            <div className="pt-4 mt-2 shrink-0">
              <Button 
                variant="outline" 
                className="w-full justify-start border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors" 
                onClick={openPricingModal}
              >
                <Star className="mr-2 h-4 w-4 fill-amber-500 text-amber-500" /> Upgrade Plan
              </Button>
            </div>
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
                        className={`group relative max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {editingIndex === i ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Textarea 
                              value={editValue} 
                              onChange={e => setEditValue(e.target.value)}
                              className="text-foreground bg-background"
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => submitEdit(i)}>Save & Send</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {m.role === "assistant" ? (
                              <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                                {m.content}
                              </ReactMarkdown>
                            ) : (
                              m.content
                            )}
                            <div className={`absolute top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                              m.role === "user" ? "-left-16" : "-right-24"
                            }`}>
                              {m.role === "user" ? (
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-background/50 hover:bg-background" onClick={() => handleEdit(i, m.content)}>
                                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              ) : (
                                <>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-background/50 hover:bg-background" onClick={() => copyToClipboard(m.content, i)}>
                                    {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-background/50 hover:bg-background" onClick={() => regenerate(i)}>
                                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </>
                        )}
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
