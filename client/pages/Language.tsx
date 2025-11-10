import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";
import { LoadingState } from "@/components/ui/loading-state";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
  { code: "es", name: "Español (Spanish)", flag: "🇪🇸" },
  { code: "fr", name: "Français (French)", flag: "🇫🇷" },
  { code: "de", name: "Deutsch (German)", flag: "🇩🇪" },
  { code: "ja", name: "日本語 (Japanese)", flag: "🇯🇵" },
  { code: "ko", name: "한국어 (Korean)", flag: "🇰🇷" },
  { code: "zh", name: "中文 (Chinese)", flag: "🇨🇳" },
  { code: "pt", name: "Português (Portuguese)", flag: "🇵🇹" },
  { code: "ar", name: "العربية (Arabic)", flag: "🇸🇦" },
];

export default function Language() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLang, setSelectedLang] = useState("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.settings?.language) {
      setSelectedLang(user.settings.language);
    }
    setLoading(false);
  }, [user]);

  const handleSelectLanguage = async (code: string) => {
    if (!user) return;
    
    try {
      setSelectedLang(code);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.language": code,
      });
      
      toast({
        title: "Language updated",
        description: "Content language preference saved",
      });
    } catch (error) {
      console.error("Failed to update language:", error);
      toast({
        title: "Error",
        description: "Failed to update language",
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingState text="Loading..." />;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Content Language</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 mb-6">
          <Globe className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600 dark:text-blue-400">
            <p>Choose your preferred language for posts and content recommendations.</p>
          </div>
        </div>

        <div className="divide-y border rounded-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </div>
              {selectedLang === lang.code && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
