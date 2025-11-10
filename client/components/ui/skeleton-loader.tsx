export function GlimpseSkeleton() {
  return (
    <div className="fixed inset-0 bg-black animate-pulse">
      {/* Header skeleton */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-white/10 rounded mb-2" />
            <div className="h-3 w-24 bg-white/10 rounded" />
          </div>
          <div className="h-8 w-16 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Video placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white/20 text-6xl">
          <svg className="animate-spin h-16 w-16" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-6">
        <div className="h-12 w-12 rounded-full bg-white/10" />
        <div className="h-12 w-12 rounded-full bg-white/10" />
        <div className="h-12 w-12 rounded-full bg-white/10" />
        <div className="h-12 w-12 rounded-full bg-white/10" />
      </div>

      {/* Caption skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        <div className="h-4 w-48 bg-white/10 rounded" />
        <div className="h-3 w-64 bg-white/10 rounded" />
        <div className="h-3 w-32 bg-white/10 rounded" />
      </div>
    </div>
  );
}
