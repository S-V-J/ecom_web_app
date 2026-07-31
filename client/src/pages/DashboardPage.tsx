/**
 * @file DashboardPage.tsx
 * @description Placeholder protected page to verify RBAC and auth flow.
 * @systemic_role Serves as the post-login landing page. Will be replaced
 * by role-specific dashboards in Phases 5, 6, and 7.
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user?.email}</strong></p>
      <p>Role: <strong>{user?.role}</strong></p>
      <p>Status: <strong>{user?.status}</strong></p>
      <button onClick={logout} style={{ marginTop: 16, padding: '8px 16px' }}>
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;