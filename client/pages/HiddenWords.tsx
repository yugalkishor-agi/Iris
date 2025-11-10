import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { ChevronLeft, Plus, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { settingsService } from "../../src/services/settings.service";

export default function HiddenWords() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [hiddenWords, setHiddenWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHiddenWords = async () => {
      if (!currentUser) return;
      try {
        const words = await settingsService.getHiddenWords(currentUser.userId);
        setHiddenWords(words);
      } catch (error) {
        console.error('Failed to load hidden words', error);
      } finally {
        setLoading(false);
      }
    };
    loadHiddenWords();
  }, [currentUser]);

  const handleAddWord = async () => {
    if (!newWord.trim() || !currentUser) return;
    
    if (hiddenWords.includes(newWord.toLowerCase())) {
      toast({
        title: "Already added",
        description: "This word is already in your list",
        variant: "destructive",
      });
      return;
    }

    try {
      await settingsService.addHiddenWord(currentUser.userId, newWord.toLowerCase());
      setHiddenWords([...hiddenWords, newWord.toLowerCase()]);
      setNewWord("");
      toast({
        title: "Word added",
        description: "Comments and DMs with this word will be filtered",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add word",
        variant: "destructive",
      });
    }
  };

  const handleRemoveWord = async (word: string) => {
    if (!currentUser) return;
    try {
      await settingsService.removeHiddenWord(currentUser.userId, word);
      setHiddenWords(hiddenWords.filter(w => w !== word));
      toast({
        title: "Word removed",
        description: "This word will no longer be filtered",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove word",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingState text="Loading hidden words..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Hidden Words</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600 dark:text-blue-400">
            <p className="font-semibold mb-1">Filter offensive content</p>
            <p>Comments and DMs containing these words will be automatically hidden from you.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Add new word or phrase</label>
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              placeholder="Type a word..."
              className="flex-1"
            />
            <Button onClick={handleAddWord} disabled={!newWord.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            HIDDEN WORDS ({hiddenWords.length})
          </h3>
          {hiddenWords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hiddenWords.map((word) => (
                <div
                  key={word}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg group hover:bg-destructive/10 transition-colors"
                >
                  <span className="text-sm">{word}</span>
                  <button
                    onClick={() => handleRemoveWord(word)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p className="text-sm">No hidden words yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
