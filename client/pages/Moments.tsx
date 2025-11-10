import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Moments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moments, setMoments] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Moments</h1>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Your Moments */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Create New Moment */}
          <button
            onClick={() => navigate('/glimpse-create-new')}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative w-20 h-20">
              {/* Avatar */}
              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden">
                {user?.avatarURL ? (
                  <img 
                    src={user.avatarURL} 
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Plus Icon */}
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center border-2 border-background">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <span className="text-white text-xs font-medium max-w-[80px] truncate">
              Your Mo...
            </span>
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-white/40" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Moments Yet</h3>
            <p className="text-white/60 text-sm text-center max-w-xs mb-6">
              Create your first moment to share with your friends
            </p>
            <button
              onClick={() => navigate('/glimpse-create-new')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              Create Moment
            </button>
          </div>
        ) : (
          moments.map((moment) => (
            <div key={moment.id} className="bg-card rounded-lg overflow-hidden">
              {/* Moment content here */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
