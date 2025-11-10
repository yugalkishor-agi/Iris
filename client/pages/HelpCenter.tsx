import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, HelpCircle, Shield, Image, MessageCircle, Settings, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const helpCategories = [
  {
    icon: HelpCircle,
    title: "Getting Started",
    description: "Learn the basics of using Iris",
    articles: 12,
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Manage your privacy settings",
    articles: 18,
  },
  {
    icon: Image,
    title: "Posts & Glimpses",
    description: "Create and share content",
    articles: 24,
  },
  {
    icon: MessageCircle,
    title: "Messages & Chat",
    description: "Connect with others",
    articles: 15,
  },
  {
    icon: Settings,
    title: "Account Settings",
    description: "Manage your account",
    articles: 20,
  },
  {
    icon: AlertCircle,
    title: "Report & Support",
    description: "Get help and report issues",
    articles: 10,
  },
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Help Center</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Popular Topics */}
        <div>
          <h2 className="font-semibold mb-3">Browse by Category</h2>
          <div className="grid gap-3">
            {helpCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.title}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{category.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {category.articles} articles
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Can't find what you're looking for? Contact our support team.
          </p>
          <Link
            to="/contact-support"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
