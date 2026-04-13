import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard, Mountain, Users, Image, Star, MessageSquare,
  FolderOpen, Settings, LogOut, ChevronLeft, Menu, Globe
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Treks", path: "/treks", icon: Mountain },
  { name: "Enrollments", path: "/enrollments", icon: Users },
  { name: "Categories", path: "/categories", icon: FolderOpen },
  { name: "Gallery", path: "/gallery", icon: Image },
  { name: "Reviews", path: "/reviews", icon: Star },
  { name: "Inquiries", path: "/inquiries", icon: MessageSquare },
  { name: "Site Content", path: "/site-content", icon: Globe },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="glass-sidebar text-white flex flex-col h-screen sticky top-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <img src="/logo.png" alt="Avir Trekkers" className="h-8 w-auto rounded" />
              <span className="text-lg font-bold font-heading bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Admin
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && <img src="/logo.png" alt="Avir Trekkers" className="h-8 w-auto rounded" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ name, path, icon: Icon }, index) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-white border border-blue-500/20"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-gradient-to-b from-blue-400 to-violet-400 rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? "text-blue-400" : "group-hover:text-blue-300"}`} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
