import { Link } from "react-router-dom";
import { ChevronLeft, Heart, Github, Globe } from "lucide-react";

const credits = [
  { name: "React", description: "UI Library", link: "https://react.dev" },
  { name: "TypeScript", description: "Type Safety", link: "https://www.typescriptlang.org" },
  { name: "Tailwind CSS", description: "Styling", link: "https://tailwindcss.com" },
  { name: "Vite", description: "Build Tool", link: "https://vitejs.dev" },
  { name: "Lucide Icons", description: "Icons", link: "https://lucide.dev" },
  { name: "Radix UI", description: "Components", link: "https://www.radix-ui.com" },
];

export default function Acknowledgements() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Link to="/settings" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold">Credits & Acknowledgements</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
            <Heart className="h-12 w-12 text-primary" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Built with love</h2>
          <p className="text-muted-foreground">
            Special thanks to the open-source community
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">TECHNOLOGIES</h3>
          {credits.map((credit) => (
            <a
              key={credit.name}
              href={credit.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div>
                <div className="font-semibold">{credit.name}</div>
                <div className="text-sm text-muted-foreground">{credit.description}</div>
              </div>
              <Globe className="h-5 w-5 text-muted-foreground" />
            </a>
          ))}
        </div>

        <div className="text-center pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Made with ❤️ by <span className="font-semibold text-primary">@Utkarsh</span>
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
