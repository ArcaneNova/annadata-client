import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

// Backend API URL - try multiple possible URLs
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Try to detect the correct URL based on the current origin
  const origin = window.location.origin;
  console.log("Current origin:", origin);
  
  // If we're on localhost, try multiple possible backend URLs
  if (origin.includes('localhost')) {
    // We'll try to connect to these URLs in order
    const possiblePorts = [5000, 5001, 5002, 3000];
    
    // Store the API URL in localStorage if we've found a working one before
    const savedApiUrl = localStorage.getItem('krishiMitraApiUrl');
    if (savedApiUrl) {
      console.log("Using saved API URL:", savedApiUrl);
      return savedApiUrl;
    }
    
    // Try each port (this is async but we'll return the default and update later if needed)
    (async () => {
      for (const port of possiblePorts) {
        const url = `http://localhost:${port}/api`;
        try {
          console.log(`Trying API URL: ${url}`);
          const response = await fetch(`${url}/health`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (response.ok) {
            console.log(`Found working API URL: ${url}`);
            localStorage.setItem('krishiMitraApiUrl', url);
            window.location.reload(); // Reload to use the working URL
            return;
          }
        } catch (error) {
          console.log(`API URL ${url} failed:`, error);
        }
      }
    })();
    
    // Return the default URL while we're checking
    return "http://localhost:5000/api";
  }
  
  // For production, assume API is on the same domain but with /api path
  return `${origin}/api`;
};

const API_URL = getApiUrl();
console.log("Using API URL:", API_URL);

type Message = {
  role: "user" | "assistant";
  content: string;
};

const KrishiMitra = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Get initial greeting based on selected language
  const getInitialGreeting = () => {
    switch(language) {
      case 'hindi':
        return "नमस्ते! मैं कृषि मित्र हूँ। मैं आपकी कृषि संबंधित प्रश्नों में मदद कर सकता हूँ। आप मुझसे कुछ भी पूछ सकते हैं!";
      case 'punjabi':
        return "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੇ ਖੇਤੀਬਾੜੀ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਮੈਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ!";
      default:
        return "Hello! I am Krishi Mitra. I can help with your agriculture-related questions. Feel free to ask me anything!";
    }
  };

  // Initial greeting message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: getInitialGreeting()
        }
      ]);
    }
  }, [isOpen, messages.length, language]);

  // Function to call AI API through backend proxy
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      console.log("Sending request to AI API...");
      
      // Call backend proxy endpoint
      const response = await fetch(`${API_URL}/ai/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          language: language
        }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("AI API error:", errorData);
        throw new Error(`AI API error: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log("Response received:", data);
      
      return data.response || "I'm sorry, I couldn't process your request at the moment. Please try again later.";
    } catch (error) {
      console.error("Error calling AI API:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive",
      });
      
      // Fallback responses based on language if API fails
      switch(language) {
        case 'hindi':
          return "क्षमा करें, मैं अभी आपके प्रश्न का उत्तर नहीं दे पा रहा हूँ। कृपया बाद में पुनः प्रयास करें।";
        case 'punjabi':
          return "ਮੁਆਫ ਕਰਨਾ, ਮੈਂ ਹੁਣੇ ਤੁਹਾਡੇ ਸਵਾਲ ਦਾ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਦਾ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।";
        default:
          return "I apologize, but I'm unable to answer your question right now. Please try again later.";
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get AI response from AI API
      const aiResponse = await getAIResponse(input);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse }
      ]);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Listening",
      description: "Speak now...",
    });
    
    // This is just a placeholder - in a real app you would implement the SpeechRecognition API
    setTimeout(() => {
      toast({
        title: "Sorry",
        description: "Speech recognition implementation requires backend configuration.",
      });
    }, 3000);
  };

  // Get title and description in the correct language
  const getBotTitle = () => {
    switch(language) {
      case 'hindi': return "कृषि मित्र";
      case 'punjabi': return "ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ";
      default: return "Krishi Mitra";
    }
  };
  
  const getBotDescription = () => {
    switch(language) {
      case 'hindi': return "आपका कृषि सहायक";
      case 'punjabi': return "ਤੁਹਾਡਾ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ";
      default: return "Your Agricultural Assistant";
    }
  };

  const getPlaceholder = () => {
    switch(language) {
      case 'hindi': return "अपना संदेश लिखें...";
      case 'punjabi': return "ਆਪਣਾ ਸੁਨੇਹਾ ਲਿਖੋ...";
      default: return "Type your message...";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg bg-[#138808] hover:bg-[#138808]/90"
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          className="sm:max-w-md md:max-w-lg w-[90vw] bg-white" 
          side="right"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center gap-2 text-[#138808]">
              <Bot className="h-5 w-5" />
              {getBotTitle()}
            </SheetTitle>
            <SheetDescription>
              {getBotDescription()}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100vh-12rem)]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-[#138808] text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === "assistant" && (
                          <Bot className="h-5 w-5 mt-1 flex-shrink-0" />
                        )}
                        <p className="text-sm">{message.content}</p>
                        {message.role === "user" && (
                          <User className="h-5 w-5 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <div className="flex gap-1">
                          <span className="animate-pulse">●</span>
                          <span className="animate-pulse delay-150">●</span>
                          <span className="animate-pulse delay-300">●</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form
              onSubmit={handleSubmit}
              className="border-t p-4 flex items-center gap-2"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={startSpeechRecognition}
                disabled={isLoading}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getPlaceholder()}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-[#138808] hover:bg-[#138808]/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default KrishiMitra;
