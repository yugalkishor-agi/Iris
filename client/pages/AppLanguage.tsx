import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
];

export default function AppLanguage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLang, setSelectedLang] = useState("en");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.settings?.appLanguage) {
      setSelectedLang(user.settings.appLanguage);
    }
  }, [user]);

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLanguage = async (code: string) => {
    if (!user) return;
    
    try {
      setSelectedLang(code);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.appLanguage": code,
      });
      
      toast({
        title: "Language updated",
        description: "App interface language saved",
      });
    } catch (error) {
      console.error("Failed to update app language:", error);
      toast({
        title: "Error",
        description: "Failed to update language",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">App Language</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="divide-y">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-accent transition-colors"
            >
              <div className="text-left">
                <div className="font-semibold">{lang.name}</div>
                <div className="text-sm text-muted-foreground">{lang.nativeName}</div>
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
