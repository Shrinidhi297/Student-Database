import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Loader2, MessageSquare } from "lucide-react";
import { AlertDialog } from "./alert-dialog";
import { parseNavigationIntent } from "@/lib/query-parser";

interface AIMessageBarProps {
  title?: string;
  description?: string;
  isSignedIn?: boolean;
}

const PRESET_QUERIES_AUTHENTICATED = [
  {
    label: "Open dashboard",
    text: "Please open the dashboard.",
  },
  {
    label: "Show students",
    text: "Please show the student directory.",
  },
  {
    label: "Get help",
    text: "Help me use the assistant.",
  },
];

const PRESET_QUERIES_ANONYMOUS = [
  {
    label: "Take me to login",
    text: "Please navigate to the login page.",
  },
  {
    label: "Get help",
    text: "Help me use the assistant.",
  },
];

export function AIMessageBar({ title = "AI Assistant", description, isSignedIn }: AIMessageBarProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [pendingIntent, setPendingIntent] = useState<{ route: string; label: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const simulateResponse = (_userMessage: string, overrideResponse?: string) => {
    setIsTyping(true);

    const response =
      overrideResponse ??
      "Hi there! I can only perform fixed actions for now. Please choose one of the buttons below.";

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { text: response, isUser: false }]);
    }, 600);
  };

  const handleConfirmNavigation = () => {
    if (!pendingIntent) return;
    navigate(pendingIntent.route);
    setPendingIntent(null);
  };

  const handlePresetClick = (text: string) => {
    const userMessage = text;
    setMessages((prev) => [...prev, { text: userMessage, isUser: true }]);

    const intent = parseNavigationIntent(userMessage);

    if (intent) {
      setPendingIntent(intent);
      setConfirmOpen(true);
      simulateResponse(userMessage, `I can help with that. Would you like me to navigate to the ${intent.label}?`);
      return;
    }

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
              Choose one of the actions below to keep the assistant working reliably.
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

      <div className="space-y-3 border-t border-white/[0.06] px-4 py-4">
        <p className="text-sm text-muted-foreground">Choose one of the fixed actions below:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(isSignedIn ? PRESET_QUERIES_AUTHENTICATED : PRESET_QUERIES_ANONYMOUS).map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => handlePresetClick(item.text)}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left text-sm text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-white/[0.08]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm navigation"
        description={
          pendingIntent
            ? `I found a matching page for your request. Navigate to the ${pendingIntent.label}?`
            : 'Do you want to proceed?'
        }
        confirmLabel="Yes, go there"
        onConfirm={handleConfirmNavigation}
      />
    </div>
  );
}


export function FloatingAiAssistant({ title, description, isSignedIn }: AIMessageBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      {isOpen && (
        <div
          className="w-[calc(100vw-2rem)] h-[480px] animate-fade-up sm:w-[360px] sm:h-[520px] md:w-[400px]"
          style={{ animationDuration: "0.25s" }}
        >
          <AIMessageBar title={title} description={description} isSignedIn={isSignedIn} />
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
