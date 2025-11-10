import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Camera, Users, Bell, BellOff, UserPlus, LogOut, Trash2, Shield, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "../../src/services/message.service";
import { userService } from "../../src/services/user.service";
import { mediaService } from "../../src/services/media.service";
import type { Conversation, User } from "../../src/types/database";

interface MemberWithDetails extends User {
  isAdmin: boolean;
}

export default function GroupChatSettings() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [groupName, setGroupName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load conversation and members
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const loadConversationData = async () => {
      try {
        setLoading(true);
        
        // Get conversation
        const conv = await messageService.getConversation(conversationId);
        if (!conv) {
          toast({
            title: "Error",
            description: "Group not found",
            variant: "destructive",
          });
          navigate("/messages");
          return;
        }

        if (conv.type !== 'group') {
          toast({
            title: "Error",
            description: "This is not a group conversation",
            variant: "destructive",
          });
          navigate("/messages");
          return;
        }

        setConversation(conv);
        setGroupName(conv.groupName || "Group Chat");
        setIsMuted(conv.mutedBy?.includes(currentUser.userId) || false);

        // Load member details
        const memberDetails = await Promise.all(
          conv.participantIds.map(async (userId) => {
            const userData = await userService.getUser(userId);
            return {
              ...userData,
              isAdmin: conv.groupAdmins?.includes(userId) || false,
            } as MemberWithDetails;
          })
        );

        setMembers(memberDetails.filter((m) => m !== null));
      } catch (error: any) {
        console.error('Error loading group data:', error);
        toast({
          title: "Error",
          description: "Failed to load group settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversationData();
  }, [conversationId, currentUser, navigate, toast]);

  const handleSaveName = async () => {
    if (!conversationId || !conversation || !groupName.trim()) return;

    try {
      setSaving(true);
      await messageService.updateConversation(conversationId, {
        groupName: groupName.trim(),
      });
      
      setConversation({ ...conversation, groupName: groupName.trim() });
      setIsEditingName(false);
      
      toast({
        title: "Group name updated",
        description: "The group name has been changed successfully.",
      });
    } catch (error: any) {
      console.error('Error updating group name:', error);
      toast({
        title: "Error",
        description: "Failed to update group name",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !conversationId || !currentUser) return;

    try {
      setUploadingAvatar(true);
      
      // Upload avatar
      const avatarURL = await mediaService.uploadAvatar(currentUser.userId, file);
      
      // Update conversation
      await messageService.updateConversation(conversationId, {
        groupAvatarURL: avatarURL,
      });

      if (conversation) {
        setConversation({ ...conversation, groupAvatarURL: avatarURL });
      }

      toast({
        title: "Avatar updated",
        description: "Group avatar has been changed successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleToggleMute = async () => {
    if (!conversationId || !currentUser) return;

    try {
      if (isMuted) {
        await messageService.unmuteConversation(conversationId, currentUser.userId);
      } else {
        await messageService.muteConversation(conversationId, currentUser.userId);
      }
      
      setIsMuted(!isMuted);
      
      toast({
        title: isMuted ? "Group unmuted" : "Group muted",
        description: isMuted 
          ? "You will receive notifications from this group" 
          : "You won't receive notifications from this group",
      });
    } catch (error: any) {
      console.error('Error toggling mute:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!conversationId || !conversation || !currentUser) return;

    // Check if current user is admin
    if (!conversation.groupAdmins?.includes(currentUser.userId)) {
      toast({
        title: "Permission denied",
        description: "Only admins can remove members",
        variant: "destructive",
      });
      return;
    }

    try {
      // Remove member from conversation
      const updatedParticipants = conversation.participantIds.filter(id => id !== memberId);
      const updatedAdmins = conversation.groupAdmins?.filter(id => id !== memberId);
      
      await messageService.updateConversation(conversationId, {
        participantIds: updatedParticipants,
        groupAdmins: updatedAdmins,
        participantCount: updatedParticipants.length,
      });

      setMembers(members.filter(m => m.userId !== memberId));
      
      toast({
        title: "Member removed",
        description: "The member has been removed from the group.",
      });
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversationId || !currentUser) return;

    try {
      await messageService.leaveGroupConversation(conversationId, currentUser.userId);
      
      toast({
        title: "Left group",
        description: "You have left the group chat.",
      });
      
      navigate("/messages");
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!conversationId || !conversation || !currentUser) return;

    // Check if current user is admin
    if (!conversation.groupAdmins?.includes(currentUser.userId)) {
      toast({
        title: "Permission denied",
        description: "Only admins can delete the group",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      // Mark conversation as deleted (soft delete)
      await messageService.updateConversation(conversationId, {
        participantIds: [],
        participantCount: 0,
      });
      
      toast({
        title: "Group deleted",
        description: "The group has been permanently deleted.",
      });
      
      navigate("/messages");
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading group settings...</p>
        </div>
      </div>
    );
  }

  if (!conversation || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const isAdmin = conversation.groupAdmins?.includes(currentUser.userId) || false;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to={`/chat/${conversationId}`} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Group Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Group Info */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={conversation.groupAvatarURL} />
                <AvatarFallback>
                  <Users className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              {isAdmin && (
                <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full hover:scale-110 transition-transform cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </label>
              )}
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-center"
                  autoFocus
                  disabled={saving}
                />
                <Button size="sm" onClick={handleSaveName} disabled={saving || !groupName.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{groupName}</h2>
                {isAdmin && (
                  <button onClick={() => setIsEditingName(true)} className="p-1 hover:bg-accent rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{members.length} members</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleToggleMute}>
            {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          {isAdmin && (
            <Button variant="outline" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          )}
        </div>

        {/* Settings */}
        <div>
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm text-muted-foreground">SETTINGS</h3>
          </div>
          <div className="divide-y">
            <div className="px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <BellOff className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Mute Notifications</div>
                  <div className="text-sm text-muted-foreground">Silence this group</div>
                </div>
              </div>
              <Switch checked={isMuted} onCheckedChange={handleToggleMute} />
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="mt-6">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">
              MEMBERS ({members.length})
            </h3>
            {isAdmin && (
              <Button variant="ghost" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
          <div className="divide-y">
            {members.map((member) => (
              <div key={member.userId} className="px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors">
                <Link to={`/profile/${member.username}`}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatarURL} />
                    <AvatarFallback>{member.displayName?.[0] || member.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-2">
                    {member.displayName || member.username}
                    {member.userId === currentUser.userId && (
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        You
                      </span>
                    )}
                    {member.isAdmin && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">@{member.username}</div>
                </div>
                {isAdmin && member.userId !== currentUser.userId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.userId)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 mb-6">
          <div className="px-4 py-3 border-b bg-destructive/10">
            <h3 className="font-semibold text-sm text-destructive">DANGER ZONE</h3>
          </div>
          <div className="divide-y">
            <button
              onClick={handleLeaveGroup}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left"
            >
              <LogOut className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium text-destructive">Leave Group</div>
                <div className="text-sm text-muted-foreground">You won't receive messages</div>
              </div>
            </button>
            {isAdmin && (
              <button 
                onClick={handleDeleteGroup}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left"
              >
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Delete Group</div>
                  <div className="text-sm text-muted-foreground">This cannot be undone</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
