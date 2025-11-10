import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Users,
  Heart,
  MessageCircle,
  X,
  MoreVertical,
  Zap,
  Gift,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: number;
  user: string;
  text: string;
  time: string;
}

interface Viewer {
  id: number;
  name: string;
  avatar?: string;
}

export default function LiveStream() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Show Coming Soon message
  useEffect(() => {
    toast({
      title: "Coming Soon! 🚀",
      description: "Live streaming feature is under development",
    });
    setTimeout(() => navigate('/'), 2000);
  }, []);

  const [isLive, setIsLive] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isLive) {
      const timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartLive = () => {
    setIsLive(true);
    setViewerCount(0);
    setDuration(0);
    toast({
      title: "Live stream started!",
      description: "You're now broadcasting live",
    });
  };

  const handleEndLive = () => {
    setIsLive(false);
    toast({
      title: "Live stream ended",
      description: `Stream duration: ${formatDuration(duration)}`,
    });
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    
    const newComment: Comment = {
      id: Date.now(),
      user: "You",
      text: commentText,
      time: "now",
    };
    
    setComments(prev => [...prev, newComment]);
    setCommentText("");
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <PageHeader
        title={isLive ? "Live Stream" : "Start Live Stream"}
        showBack
        gradient
        rightElement={
          isLive && (
            <Badge variant="destructive" className="gap-2 px-3 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-white" />
              LIVE
            </Badge>
          )
        }
      />

      {/* Video Preview */}
      <div className="flex-1 relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Camera placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isCameraOn ? (
            <div className="text-center">
              <Video className="h-24 w-24 text-white/30 mx-auto mb-4" />
              <p className="text-white/50 text-sm">Camera preview</p>
            </div>
          ) : (
            <div className="text-center">
              <VideoOff className="h-24 w-24 text-white/50 mx-auto mb-4" />
              <p className="text-white/50">Camera is off</p>
            </div>
          )}
        </div>

        {/* Live Stats Overlay */}
        {isLive && (
          <>
            {/* Top Stats */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-red-600 hover:bg-red-600 gap-2 px-3">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </Badge>
                <Badge variant="secondary" className="gap-2 bg-black/50 backdrop-blur-sm border-white/20">
                  <Users className="h-3 w-3" />
                  {viewerCount}
                </Badge>
                <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm border-white/20">
                  {formatDuration(duration)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70"
              >
                <MoreVertical className="h-5 w-5 text-white" />
              </Button>
            </div>

            {/* Viewers List */}
            <div className="absolute top-20 right-4">
              <div className="flex flex-col gap-2">
                {viewers.slice(0, 5).map((viewer) => (
                  <Avatar key={viewer.id} className="h-10 w-10 border-2 border-white/30">
                    <AvatarImage src={viewer.avatar} />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {viewer.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>

            {/* Comments Overlay */}
            <div className="absolute bottom-32 left-4 right-4 max-h-64 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {comments.slice(-5).map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 max-w-[80%] border border-white/10"
                    >
                      <p className="text-white text-sm">
                        <span className="font-semibold">{comment.user}:</span> {comment.text}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Like Animation Area */}
            <div className="absolute bottom-32 right-4">
              <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-bounce" />
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-background border-t space-y-4">
        {isLive ? (
          <>
            {/* Live Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isCameraOn ? "default" : "destructive"}
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={() => setIsCameraOn(!isCameraOn)}
              >
                {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>

              <Button
                variant={isMicOn ? "default" : "destructive"}
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full border-2"
                onClick={() => setLikes(likes + 1)}
              >
                <Heart className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full border-2"
              >
                <Share2 className="h-6 w-6" />
              </Button>
            </div>

            {/* Comment Input */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                className="flex-1"
              />
              <Button onClick={handleSendComment} size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>

            {/* End Stream Button */}
            <Button
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              onClick={handleEndLive}
            >
              <X className="h-5 w-5" />
              End Live Stream
            </Button>
          </>
        ) : (
          <>
            {/* Pre-Stream Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant={isCameraOn ? "default" : "outline"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsCameraOn(!isCameraOn)}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                variant={isMicOn ? "default" : "outline"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>

            {/* Start Button */}
            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              onClick={handleStartLive}
            >
              <Zap className="h-5 w-5" />
              Go Live
            </Button>

            {/* Info */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Your followers will be notified when you start</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
