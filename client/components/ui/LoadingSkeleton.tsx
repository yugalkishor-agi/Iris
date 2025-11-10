// Loading Skeleton for smooth loading states
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-white/5 rounded-2xl"></div>
      <div className="space-y-3">
        <div className="h-4 bg-white/5 rounded-xl w-3/4"></div>
        <div className="h-4 bg-white/5 rounded-xl w-1/2"></div>
      </div>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 bg-card rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/5 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/5 rounded-xl w-1/3"></div>
          <div className="h-2 bg-white/5 rounded-xl w-1/4"></div>
        </div>
      </div>
      {/* Image */}
      <div className="aspect-square bg-white/5 rounded-2xl"></div>
      {/* Actions */}
      <div className="flex gap-4">
        <div className="h-6 w-6 bg-white/5 rounded-full"></div>
        <div className="h-6 w-6 bg-white/5 rounded-full"></div>
        <div className="h-6 w-6 bg-white/5 rounded-full"></div>
      </div>
      {/* Caption */}
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded-xl"></div>
        <div className="h-3 bg-white/5 rounded-xl w-2/3"></div>
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex-shrink-0 animate-pulse">
          <div className="w-16 h-16 bg-white/5 rounded-full"></div>
          <div className="h-2 bg-white/5 rounded-xl w-12 mt-2 mx-auto"></div>
        </div>
      ))}
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse p-3">
      <div className="w-8 h-8 bg-white/5 rounded-full flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/5 rounded-xl w-1/4"></div>
        <div className="h-3 bg-white/5 rounded-xl w-full"></div>
        <div className="h-3 bg-white/5 rounded-xl w-3/4"></div>
      </div>
    </div>
  );
}
