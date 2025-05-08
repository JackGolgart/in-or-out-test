import ProtectedRoute from '../components/ProtectedRoute';

export default function ProfileWrapper() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}

import { useAuth } from '../lib/AuthContext';

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-lg mx-auto bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
        <p>Email: <span className="text-purple-400">{user.email}</span></p>
        <p className="mt-4">User ID: <code className="text-gray-400 text-sm">{user.id}</code></p>
      </div>
    </div>
  );
}

