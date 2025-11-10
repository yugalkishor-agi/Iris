import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Heart,
  TrendingUp,
  Calendar,
  Gift,
  Coffee,
  Sunrise,
  Music,
  Camera,
  Star,
  Zap,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Template {
  id: number;
  name: string;
  category: string;
  gradient: string;
  icon: React.ReactNode;
  isPremium?: boolean;
}

const templates: Template[] = [
  {
    id: 1,
    name: "Good Morning",
    category: "daily",
    gradient: "from-orange-400 via-pink-500 to-purple-600",
    icon: <Sunrise className="h-8 w-8" />,
  },
  {
    id: 2,
    name: "Coffee Time",
    category: "daily",
    gradient: "from-amber-600 via-brown-500 to-stone-700",
    icon: <Coffee className="h-8 w-8" />,
  },
  {
    id: 3,
    name: "OOTD",
    category: "daily",
    gradient: "from-pink-500 via-purple-500 to-indigo-600",
    icon: <Sparkles className="h-8 w-8" />,
  },
  {
    id: 4,
    name: "Birthday",
    category: "celebration",
    gradient: "from-yellow-400 via-pink-500 to-purple-600",
    icon: <Gift className="h-8 w-8" />,
    isPremium: true,
  },
  {
    id: 5,
    name: "Love",
    category: "celebration",
    gradient: "from-red-500 via-pink-500 to-rose-600",
    icon: <Heart className="h-8 w-8" />,
  },
  {
    id: 6,
    name: "Trending",
    category: "social",
    gradient: "from-cyan-500 via-blue-500 to-purple-600",
    icon: <TrendingUp className="h-8 w-8" />,
    isPremium: true,
  },
  {
    id: 7,
    name: "Music Vibe",
    category: "creative",
    gradient: "from-purple-600 via-pink-500 to-red-500",
    icon: <Music className="h-8 w-8" />,
  },
  {
    id: 8,
    name: "Photo Dump",
    category: "creative",
    gradient: "from-slate-700 via-gray-600 to-zinc-800",
    icon: <Camera className="h-8 w-8" />,
  },
  {
    id: 9,
    name: "Throwback",
    category: "memories",
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
    icon: <Calendar className="h-8 w-8" />,
  },
  {
    id: 10,
    name: "Goals",
    category: "motivation",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    icon: <Zap className="h-8 w-8" />,
  },
  {
    id: 11,
    name: "Highlight",
    category: "social",
    gradient: "from-yellow-400 via-amber-500 to-orange-600",
    icon: <Star className="h-8 w-8" />,
    isPremium: true,
  },
];

const categories = [
  { id: "all", name: "All Templates" },
  { id: "daily", name: "Daily" },
  { id: "celebration", name: "Celebration" },
  { id: "creative", name: "Creative" },
  { id: "social", name: "Social" },
  { id: "memories", name: "Memories" },
  { id: "motivation", name: "Motivation" },
];

export default function StoryTemplates() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleUseTemplate = (template: Template) => {
    if (template.isPremium) {
      toast({
        title: "Premium Template",
        description: "Upgrade to Premium to use this template",
      });
    } else {
      toast({
        title: "Template selected!",
        description: `Using "${template.name}" template`,
      });
      navigate("/story-create", { state: { templateId: template.id } });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title="Story Templates"
        subtitle="Choose a template to get started"
        gradient
      />

      {/* Category Tabs */}
      <div className="border-b bg-background sticky top-14 z-40">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-4 py-3 min-w-max">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 p-4 pb-20">
        <div className="grid grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative group ${
                selectedTemplate === template.id ? "ring-2 ring-primary ring-offset-2" : ""
              } rounded-xl overflow-hidden transition-all`}
            >
              {/* Template Preview */}
              <div
                className={`aspect-[9/16] bg-gradient-to-br ${template.gradient} flex flex-col items-center justify-center text-white p-4 relative overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                {/* Icon */}
                <div className="relative z-10 mb-4 p-4 bg-white/20 backdrop-blur-sm rounded-full">
                  {template.icon}
                </div>

                {/* Title */}
                <h3 className="relative z-10 font-bold text-lg text-center">
                  {template.name}
                </h3>

                {/* Premium Badge */}
                {template.isPremium && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500/90 text-yellow-950 border-yellow-600">
                      <Star className="h-3 w-3 mr-1" fill="currentColor" />
                      Premium
                    </Badge>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Use Template
                  </Button>
                </div>
              </div>

              {/* Template Name */}
              <div className="p-2 bg-muted/50 text-center">
                <p className="text-sm font-medium truncate">{template.name}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-6 bg-muted/50 rounded-full mb-4">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-sm text-muted-foreground">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {selectedTemplate && (
        <div className="sticky bottom-0 p-4 border-t bg-background/95 backdrop-blur-sm">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => {
              const template = templates.find((t) => t.id === selectedTemplate);
              if (template) handleUseTemplate(template);
            }}
          >
            <Download className="h-5 w-5" />
            Use Selected Template
          </Button>
        </div>
      )}
    </div>
  );
}
