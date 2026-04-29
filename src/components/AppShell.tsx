import { BookMarked, House, LogOut, MessagesSquare, PlusSquare } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/", label: "Home / Wormie", icon: House },
  { to: "/add-book", label: "Add a Book", icon: PlusSquare },
  { to: "/sharing-requests", label: "Sharing Requests", icon: MessagesSquare }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <div className="brand-icon">
            <BookMarked size={18} />
          </div>
          <div>
            <p className="eyebrow">Trade or lend with your fellow Ingeneers and Visioneers</p>
            <h1>Wormie</h1>
          </div>
        </div>
        <div className="user-chip">
          <span>{user?.display_name}</span>
          <small>{user?.email}</small>
        </div>
      </header>

      <div className="shell-grid">
        <nav className="sidebar">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          <button className="nav-link nav-button" type="button" onClick={logout}>
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </nav>

        <main className="content-panel">{children}</main>
      </div>
    </div>
  );
}

