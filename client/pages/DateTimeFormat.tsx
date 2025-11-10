import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../src/config/firebase";

const timeFormats = [
  { id: "12h", name: "12-hour", example: "2:30 PM" },
  { id: "24h", name: "24-hour", example: "14:30" },
];

const dateFormats = [
  { id: "mdy", name: "MM/DD/YYYY", example: "12/31/2024" },
  { id: "dmy", name: "DD/MM/YYYY", example: "31/12/2024" },
  { id: "ymd", name: "YYYY-MM-DD", example: "2024-12-31" },
];

export default function DateTimeFormat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeFormat, setTimeFormat] = useState("12h");
  const [dateFormat, setDateFormat] = useState("mdy");

  useEffect(() => {
    if (user?.settings?.timeFormat) {
      setTimeFormat(user.settings.timeFormat);
    }
    if (user?.settings?.dateFormat) {
      setDateFormat(user.settings.dateFormat);
    }
  }, [user]);

  const handleTimeSelect = async (id: string) => {
    if (!user) return;
    
    try {
      setTimeFormat(id);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.timeFormat": id,
      });
      toast({ title: "Time format updated" });
    } catch (error) {
      console.error("Failed to update time format:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update time format",
        variant: "destructive" 
      });
    }
  };

  const handleDateSelect = async (id: string) => {
    if (!user) return;
    
    try {
      setDateFormat(id);
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        "settings.dateFormat": id,
      });
      toast({ title: "Date format updated" });
    } catch (error) {
      console.error("Failed to update date format:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update date format",
        variant: "destructive" 
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
          <h1 className="text-lg font-semibold">Date/Time Format</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">TIME FORMAT</h3>
          </div>
          {timeFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => handleTimeSelect(format.id)}
              className={`w-full p-4 border rounded-lg transition-all text-left ${
                timeFormat === format.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{format.name}</div>
                  <div className="text-sm text-muted-foreground">{format.example}</div>
                </div>
                {timeFormat === format.id && <Check className="h-5 w-5 text-primary" />}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">DATE FORMAT</h3>
          {dateFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => handleDateSelect(format.id)}
              className={`w-full p-4 border rounded-lg transition-all text-left ${
                dateFormat === format.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{format.name}</div>
                  <div className="text-sm text-muted-foreground">{format.example}</div>
                </div>
                {dateFormat === format.id && <Check className="h-5 w-5 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
