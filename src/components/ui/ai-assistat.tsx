import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Loader2, MessageSquare } from "lucide-react";

interface AIMessageBarProps {
  title?: string;
  description?: string;
}

export function AIMessageBar({ title = "AI Assistant", description }: AIMessageBarProps) {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    let response = "Hi there! I'm your AI assistant. How can I help you today?";

    if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
      response = "Hello! I'm your friendly AI assistant. What can I do for you?";
    } else if (userMessage.toLowerCase().includes("help")) {
      response = "I'm here to help! You can ask me questions, request information, or just chat.";
    } else if (userMessage.toLowerCase().includes("thank")) {
      response = "You're welcome! Is there anything else you'd like to know?";
    } else if (userMessage.toLowerCase().includes("who are you")) {
      response = "I'm an AI assistant designed to be helpful, harmless, and honest!";
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: response, isUser: false }]);
    }, 1500);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (input.trim() === "") return;

    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);
    setInput("");

    simulateResponse(userMessage);
  };

  const clearChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0d0d1f] to-[#0a0a1a] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-4 backdrop-blur-2xl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={clearChat}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          title="Clear chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-foreground">How can I help you today?</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Ask me anything and I'll do my best to assist you!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.isUser
                      ? "rounded-tr-sm bg-primary text-primary-foreground"
                      : "rounded-tl-sm border border-white/[0.06] bg-white/[0.04] text-foreground"
                  } animate-fade-in`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1 transition-all duration-200 focus-within:border-primary/30 focus-within:bg-white/[0.05]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="submit"
            disabled={input.trim() === ""}
            className={`rounded-lg p-2 transition-colors ${
              input.trim() === ""
                ? "text-muted-foreground/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}


export function FloatingAiAssistant({ title, description }: AIMessageBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
      {isOpen && (
        <div
          className="h-[480px] w-[360px] animate-fade-up sm:h-[520px] sm:w-[400px]"
          style={{ animationDuration: "0.25s" }}
        >
          <AIMessageBar title={title} description={description} />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center rounded-full border border-white/[0.08] shadow-glass transition-all duration-200 hover:shadow-glow ${
          isOpen
            ? "h-10 w-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "h-14 w-14 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
        }`}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
