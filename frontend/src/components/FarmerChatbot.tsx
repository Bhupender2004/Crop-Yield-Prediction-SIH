import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface FarmerChatbotProps {
  className?: string;
}

export const FarmerChatbot: React.FC<FarmerChatbotProps> = ({ className }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "🌾 Hello! I'm your AI farming assistant. I can help you with:\n\n• Crop cultivation techniques\n• Soil management and fertilization\n• Pest and disease control\n• Weather and irrigation advice\n• Market prices and trends\n• Sustainable farming practices\n\nWhat farming question can I help you with today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: inputMessage,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickMessage = async (messageText: string) => {
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          history: messages.slice(-5)
        })
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <MessageCircle className="h-5 w-5" />
          AI Farming Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 p-4 bg-gray-50/50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.sender === 'bot' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    {message.sender === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        message.sender === 'user' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {message.text}
                      </div>
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[85%] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600 mr-2">Thinking</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about farming, crops, soil, pests..."
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-md"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {messages.length === 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendQuickMessage("How do I improve my crop yield?")}
                className="text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                🌾 Improve Yield
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendQuickMessage("What fertilizer should I use?")}
                className="text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                🧪 Fertilizer Advice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendQuickMessage("How to control pests naturally?")}
                className="text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                🐛 Pest Control
              </Button>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Powered by AI • Ask anything about farming and agriculture
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
