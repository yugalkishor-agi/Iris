import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Check, X } from 'lucide-react';
import { glimpseService } from '../../../src/services/glimpse.service';
import { useToast } from '@/hooks/use-toast';

interface CollaborationRequestMessageProps {
  messageId: string;
  glimpseId: string;
  glimpseMediaURL: string;
  glimpseCaption?: string;
  senderUsername: string;
  status?: 'pending' | 'accepted' | 'rejected';
  onStatusChange?: (status: 'accepted' | 'rejected') => void;
}

export function CollaborationRequestMessage({
  messageId,
  glimpseId,
  glimpseMediaURL,
  glimpseCaption,
  senderUsername,
  status = 'pending',
  onStatusChange,
}: CollaborationRequestMessageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Accept collaboration - glimpseService will handle userId from context
      // For now, pass empty strings as the method signature requires them
      await glimpseService.acceptCollaboration(glimpseId, '', '');
      setCurrentStatus('accepted');
      onStatusChange?.('accepted');
      toast({
        title: 'Collaboration accepted!',
        description: 'You are now a collaborator on this glimpse',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to accept',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      // TODO: Add reject method in glimpse service
      setCurrentStatus('rejected');
      onStatusChange?.('rejected');
      toast({
        title: 'Collaboration rejected',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to reject',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewGlimpse = () => {
    navigate(`/glimpses`, { state: { glimpseId } });
  };

  return (
    <div className="max-w-xs">
      <div className="border rounded-lg overflow-hidden bg-card">
        {/* Glimpse Preview */}
        <div 
          onClick={handleViewGlimpse}
          className="relative aspect-[9/16] bg-muted cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img 
            src={glimpseMediaURL} 
            alt="Glimpse preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Collaboration Info */}
        <div className="p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold">Collaboration Request</p>
            <p className="text-xs text-muted-foreground mt-1">
              {senderUsername} wants to collaborate with you on this glimpse
            </p>
          </div>

          {glimpseCaption && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {glimpseCaption}
            </p>
          )}

          {/* Action Buttons */}
          {currentStatus === 'pending' ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 gap-2"
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={loading}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          ) : currentStatus === 'accepted' ? (
            <div className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2">
              <Check className="h-4 w-4" />
              Collaboration Accepted
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2">
              <X className="h-4 w-4" />
              Collaboration Rejected
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewGlimpse}
            className="w-full text-xs"
          >
            View Glimpse
          </Button>
        </div>
      </div>
    </div>
  );
}
