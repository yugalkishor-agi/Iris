export default function Security() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Security</h1>
      <div className="space-y-3 text-sm">
        <label className="block">Two-factor Authentication</label>
        <div className="rounded-md border p-3">Configure 2FA when backend is ready.</div>
        <label className="block">Change Password</label>
        <div className="rounded-md border p-3">Form placeholder for current/new password.</div>
        <label className="block">Active Sessions</label>
        <div className="rounded-md border p-3">List sessions and revoke access.</div>
      </div>
    </div>
  );
}
