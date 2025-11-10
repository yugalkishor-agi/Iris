import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SharedContentMessage } from '@/components/chat/SharedContentMessage';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Camera, 
  Mic, Image as ImageIcon, MapPin, Smile, Heart, Laugh, ThumbsUp, 
  Sparkles, Check, CheckCheck 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  isMine: boolean;
  time: string;
  status: 'sent' | 'delivered' | 'seen';
  reactions?: string[];
  type?: 'text' | 'shared_post' | 'shared_glimpse' | 'shared_story' | 'voice';
  sharedContent?: any;
  voiceUrl?: string;
  voiceDuration?: number;
}

// Messages will be fetched from API
const mockMessages: Message[] = [];

const quickReactions = [
  { emoji: '❤️', icon: Heart, color: 'text-red-500' },
  { emoji: '😂', icon: Laugh, color: 'text-yellow-500' },
  { emoji: '👍', icon: ThumbsUp, color: 'text-blue-500' },
  { emoji: '😍', icon: Sparkles, color: 'text-pink-500' },
];

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = {
    name: "DailyBrew",
    avatar: "",
    online: true,
    isTyping: false,
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isMine: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };
  
  const handleVoiceSend = (audioBlob: Blob, duration: number) => {
    const voiceUrl = URL.createObjectURL(audioBlob);
    
    const newMessage: Message = {
      id: messages.length + 1,
      text: '',
      isMine: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      type: 'voice',
      voiceUrl,
      voiceDuration: duration,
    };

    setMessages([...messages, newMessage]);
    setShowVoiceRecorder(false);
    
    toast({
      title: 'Voice Note Sent',
      description: `${duration}s`,
    });
  };

  const handleReaction = (messageId: number, emoji: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
        : msg
    ));
    toast({
      description: `Reacted with ${emoji}`,
    });
  };

  const attachmentOptions = [
    { icon: ImageIcon, label: "Gallery", color: "from-purple-500 to-pink-500" },
    { icon: Camera, label: "Camera", color: "from-blue-500 to-cyan-500" },
    { icon: MapPin, label: "Location", color: "from-green-500 to-emerald-500" },
    { icon: Smile, label: "Stickers", color: "from-yellow-500 to-orange-500" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-b from-background via-background to-transparent">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3 flex-1">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-accent rounded-full transition-colors active:scale-90"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              {user.online && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{user.name}</h2>
              <p className="text-xs text-muted-foreground">
                {user.isTyping ? (
                  <span className="text-primary animate-pulse">typing...</span>
                ) : user.online ? (
                  "Active now"
                ) : (
                  "Active 2h ago"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-accent rounded-full transition-all active:scale-90">
              <Phone className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded-full transition-all active:scale-90">
              <Video className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-accent rounded-full transition-all active:scale-90">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {!message.isMine && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
            )}

            <div 
              className={`relative max-w-[75%] group`}
              onTouchStart={(e) => {
                const startTime = Date.now();
                const touchEnd = () => {
                  const duration = Date.now() - startTime;
                  if (duration > 500) {
                    setSelectedMessage(message.id);
                  }
                };
                e.currentTarget.addEventListener('touchend', touchEnd, { once: true });
              }}
              onDoubleClick={() => handleReaction(message.id, '❤️')}
            >
              {/* Message Bubble */}
              {/* Check if it's a shared content message */}
              {(message.type === 'shared_post' || message.type === 'shared_glimpse' || message.type === 'shared_story') && message.sharedContent ? (
                <SharedContentMessage 
                  sharedContent={message.sharedContent}
                  message={message.text}
                />
              ) : (
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.isMine
                      ? 'bg-gradient-to-br from-primary via-cyan-500 to-blue-600 text-white shadow-lg shadow-primary/30'
                      : 'bg-muted/80 backdrop-blur-sm border border-border/50 text-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              )}

              {/* Time & Status */}
              <div className={`flex items-center gap-1 mt-1 ${message.isMine ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-muted-foreground/70">{message.time}</span>
                {message.isMine && (
                  <>
                    {message.status === 'sent' && <Check className="h-3 w-3 text-muted-foreground" />}
                    {message.status === 'delivered' && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
                    {message.status === 'seen' && <CheckCheck className="h-3 w-3 text-primary" />}
                  </>
                )}
              </div>

              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="absolute -bottom-2 right-2 flex gap-1 bg-background border border-border rounded-full px-2 py-0.5 shadow-lg">
                  {message.reactions.map((emoji, i) => (
                    <span key={i} className="text-sm">{emoji}</span>
                  ))}
                </div>
              )}

              {/* Quick Reaction Popup */}
              {selectedMessage === message.id && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-md border border-border rounded-full px-2 py-2 flex gap-2 shadow-2xl animate-in zoom-in-95 duration-200">
                  {quickReactions.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => {
                        handleReaction(message.id, reaction.emoji);
                        setSelectedMessage(null);
                      }}
                      className="p-2 hover:bg-accent rounded-full transition-all active:scale-90"
                    >
                      <reaction.icon className={`h-5 w-5 ${reaction.color}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-muted/80 rounded-2xl px-4 py-3 flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Options */}
      {showAttachments && (
        <div className="px-4 pb-3 animate-in slide-in-from-bottom duration-300">
          <div className="grid grid-cols-4 gap-3">
            {attachmentOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => {
                  toast({ description: `${option.label} selected` });
                  setShowAttachments(false);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-accent transition-all active:scale-95"
              >
                <div className={`p-3 bg-gradient-to-br ${option.color} rounded-full`}>
                  <option.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            className="p-2.5 hover:bg-accent rounded-full transition-all active:scale-90"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-muted/60 backdrop-blur-md rounded-full px-4 py-2.5 border border-border/50 focus-within:border-primary/50 focus-within:shadow-[0_0_12px_rgba(14,165,233,0.3)] transition-all">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60"
            />
            
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="text-primary font-bold hover:text-primary/80 transition-all text-sm hover:scale-105 active:scale-95"
              >
                Send
              </button>
            ) : (
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Smile className="h-5 w-5" />
              </button>
            )}
          </div>

          {!inputText.trim() && (
            <button
              onClick={() => setShowVoiceRecorder(true)}
              className="p-2 rounded-full transition-all active:scale-90 hover:bg-accent"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Tap outside to close reaction menu */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
}
