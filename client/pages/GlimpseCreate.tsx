import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/ui/loading-state";

/**
 * Legacy GlimpseCreate - Redirects to new comprehensive editor
 * 
 * Old route: /glimpse-create
 * New route: /glimpse-create-new
 * 
 * This file automatically redirects users to the new editor with all features:
 * - Basic Editor (text, music, filters, stickers)
 * - Advanced Editor (timeline, effects, audio mixing)
 * - Music from Audius API
 * - Stock images from Pixabay
 * - GIFs from Giphy
 * - Cover selection
 * - Caption & series linking
 * - 3-minute video limit
 */
export default function GlimpseCreate() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to new comprehensive glimpse editor
    navigate('/glimpse-create-new', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <LoadingState text="Opening Glimpse Editor..." />
    </div>
  );
}
