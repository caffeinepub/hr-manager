import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  LogOut,
  QrCode,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsAdmin } from "../hooks/useQueries";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/scanner", icon: QrCode, label: "QR Scanner", highlight: true },
  { to: "/employees", icon: Users, label: "Employees" },
  { to: "/attendance", icon: Calendar, label: "Attendance" },
  { to: "/performance", icon: BarChart3, label: "Performance" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const { data: profile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsAdmin();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sidebar-foreground text-lg">
              HR Manager
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1" data-ocid="nav.section">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group ${
                isActive(item.to)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : item.highlight
                    ? "bg-sidebar-accent/70 text-sidebar-foreground hover:bg-sidebar-accent"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.highlight && !isActive(item.to) && (
                <Badge className="ml-auto text-xs bg-sidebar-primary text-sidebar-primary-foreground px-1.5 py-0">
                  Kiosk
                </Badge>
              )}
              {isActive(item.to) && (
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              )}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          {isAuthenticated && profile && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-sidebar-primary-foreground">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {profile.name}
                </p>
                {isAdmin && (
                  <Badge className="text-[10px] px-1 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAuth}
            disabled={loginStatus === "logging-in"}
            data-ocid="nav.auth.button"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm gap-2"
          >
            {isAuthenticated ? (
              <>
                <LogOut className="w-4 h-4" /> Logout
              </>
            ) : loginStatus === "logging-in" ? (
              "Logging in..."
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Login
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
