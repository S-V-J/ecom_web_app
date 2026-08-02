/**
 * @file App.tsx
 * @description Root application component for the Universal E-Commerce System.
 * @systemic_role Establishes the top-level routing architecture for all portals,
 * renders the global navigation shell, and verifies backend connectivity.
 */
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';

// Layouts & Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';

// ==========================================
// HEALTH CHECK COMPONENT
// ==========================================
function HealthCheck() {
  const [status, setStatus] = useState<string>('Checking...');
  const [serverTime, setServerTime] = useState<string>('');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success === true || data.status === 'OK') {
          setStatus('✅ Connected');
          setServerTime(data.timestamp || new Date().toISOString());
        } else {
          setStatus('❌ Unexpected response');
        }
      })
      .catch(() => setStatus('❌ Server unreachable'));
  }, []);

  return (
    <div className="health-check">
      <span className="health-label">Backend:</span>
      <span className="health-value">{status}</span>
      {serverTime && <span className="health-time">{serverTime}</span>}
    </div>
  );
}

// ==========================================
// NAVIGATION HEADER (Public Only)
// ==========================================
function NavBar() {
  const location = useLocation();
  const navLinks = [
    { path: '/', label: '🛒 Storefront' },
    { path: '/admin', label: '⚙️ Admin' },
    { path: '/employee', label: '👷 Employee' },
    { path: '/login', label: '🔐 Login' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/">Universal E-Commerce</Link>
      </div>
      <nav className="navbar-links">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? 'nav-link active' : 'nav-link'}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <HealthCheck />
    </header>
  );
}

// ==========================================
// PLACEHOLDER PAGES
// ==========================================
function PublicStorefront() {
  return (
    <main className="page-container">
      <h1>🛒 Public Shopping Portal</h1>
      <p>Browse products, add to cart, and checkout.</p>
      <p className="placeholder-note">Full implementation in Phase 7</p>
    </main>
  );
}

function EmployeePortal() {
  return (
    <main className="page-container">
      <h1>👷 Employee Portal</h1>
      <p>Team Lead and Staff dashboards, task management, and notifications.</p>
      <p className="placeholder-note">Full implementation in Phase 6</p>
    </main>
  );
}

function LoginPage() {
  return (
    <main className="page-container">
      <h1>🔐 Login</h1>
      <p>Email/Password, Phone OTP, or Gmail OAuth authentication.</p>
      <p className="placeholder-note">Full implementation in Phase 4</p>
    </main>
  );
}

function NotFound() {
  return (
    <main className="page-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="back-link">← Back to Storefront</Link>
    </main>
  );
}

// ==========================================
// ROUTER CONTENT (Must be inside BrowserRouter)
// ==========================================
function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {/* Hide public navbar when in admin portal */}
      {!isAdminRoute && <NavBar />}
      
      <div className={!isAdminRoute ? 'app-shell' : ''}>
        <Routes>
          <Route path="/" element={<PublicStorefront />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/employee" element={<EmployeePortal />} />
          
          {/* Admin Routes with Dedicated Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="teams" element={<div className="p-6 text-gray-500">Team Management (Phase 5.3)</div>} />
            <Route path="employees" element={<div className="p-6 text-gray-500">Employees (Phase 5.5)</div>} />
            <Route path="categories" element={<div className="p-6 text-gray-500">Categories (Phase 5.7)</div>} />
            <Route path="settings" element={<div className="p-6 text-gray-500">Global Settings (Phase 5.6)</div>} />
            <Route path="audit" element={<div className="p-6 text-gray-500">Audit Log (Phase 5.8)</div>} />
            <Route path="flags" element={<div className="p-6 text-gray-500">Feature Flags (Phase 5.9)</div>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {!isAdminRoute && (
          <footer className="app-footer">
            <p>Universal E-Commerce System — Interactive Demo v1.0</p>
          </footer>
        )}
      </div>
    </>
  );
}

// ==========================================
// ROOT APP COMPONENT
// ==========================================
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}