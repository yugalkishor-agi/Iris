import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../../src/config/supabase';
import { db } from '../../src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function TestFeatures() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<Record<string, boolean | string>>({});

  const tests = [
    {
      name: 'Authentication',
      test: async () => {
        return user ? '✅ Logged in' : '❌ Not logged in';
      }
    },
    {
      name: 'Firebase Connection',
      test: async () => {
        try {
          const testCol = collection(db, 'test');
          await getDocs(testCol);
          return '✅ Connected';
        } catch (e: any) {
          return `❌ ${e.message}`;
        }
      }
    },
    {
      name: 'Supabase Connection',
      test: async () => {
        try {
          const { data, error } = await supabase
            .from('test')
            .select('*')
            .limit(1);
          if (error && error.code === 'PGRST116') {
            return '✅ Connected (table not found is OK)';
          }
          return error ? `❌ ${error.message}` : '✅ Connected';
        } catch (e: any) {
          return `❌ ${e.message}`;
        }
      }
    },
    {
      name: 'Supabase Storage',
      test: async () => {
        try {
          const { data, error } = await supabase.storage.listBuckets();
          if (error) return `❌ ${error.message}`;
          const glimpsesBucket = data?.find(b => b.name === 'glimpses');
          return glimpsesBucket ? '✅ Glimpses bucket exists' : '⚠️ No glimpses bucket';
        } catch (e: any) {
          return `❌ ${e.message}`;
        }
      }
    },
    {
      name: 'Upload Menu',
      test: async () => {
        try {
          const uploadMenu = document.querySelector('[class*="fixed bottom-20"]');
          return uploadMenu ? '✅ Rendered' : '❌ Not found';
        } catch (e: any) {
          return `❌ ${e.message}`;
        }
      }
    },
  ];

  const runTests = async () => {
    const newResults: Record<string, boolean | string> = {};
    for (const t of tests) {
      try {
        newResults[t.name] = await t.test();
      } catch (e: any) {
        newResults[t.name] = `❌ ${e.message}`;
      }
    }
    setResults(newResults);
  };

  const getStatusIcon = (result: boolean | string) => {
    if (typeof result === 'string') {
      if (result.startsWith('✅')) return <Check className="h-5 w-5 text-green-500" />;
      if (result.startsWith('⚠️')) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      return <X className="h-5 w-5 text-red-500" />;
    }
    return result ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-white mt-4">Feature Tests</h1>
          <p className="text-white/60 mt-2">Test all Iris features and backend connections</p>
        </div>

        {/* Test Button */}
        <Button onClick={runTests} className="w-full mb-6 bg-primary">
          Run All Tests
        </Button>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.name}
                className="bg-gray-900 rounded-lg p-4 flex items-center justify-between border border-gray-800"
              >
                <div>
                  <h3 className="text-white font-semibold">{test.name}</h3>
                  <p className="text-sm text-white/60 mt-1">
                    {results[test.name] ? String(results[test.name]) : 'Not tested'}
                  </p>
                </div>
                {results[test.name] && getStatusIcon(results[test.name])}
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/glimpse-create-new')}
            className="w-full"
          >
            Test Editor
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Test Upload Menu
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/messages')}
            className="w-full"
          >
            Test Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/glimpses')}
            className="w-full"
          >
            Test Glimpses
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="mt-8 bg-gray-900 rounded-lg p-4 border border-gray-800">
            <h3 className="text-white font-semibold mb-2">User Info</h3>
            <div className="space-y-1 text-sm text-white/60">
              <p><strong>ID:</strong> {user.userId}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">💡 How to Test</h3>
          <ol className="text-sm text-white/80 space-y-1 list-decimal list-inside">
            <li>Click "Run All Tests" to check connections</li>
            <li>Use Quick Links to test individual features</li>
            <li>Check console (F12) for detailed errors</li>
            <li>Report any issues you find</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
