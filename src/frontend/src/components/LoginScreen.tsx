import { Button } from "@/components/ui/button";
import { BarChart3, Building2, Clock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-sidebar-accent rounded-2xl p-8 border border-sidebar-border shadow-card-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-sidebar-primary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-sidebar-foreground mb-2">
              HR Manager
            </h1>
            <p className="text-sidebar-foreground/60 text-sm">
              Sign in to access your company's HR dashboard
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { icon: Shield, text: "Secure employee records" },
              { icon: Clock, text: "Real-time attendance tracking" },
              { icon: BarChart3, text: "Performance analytics" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-sm text-sidebar-foreground/70"
              >
                <Icon className="w-4 h-4 text-sidebar-primary" />
                {text}
              </div>
            ))}
          </div>

          <Button
            onClick={() => login()}
            disabled={loginStatus === "logging-in"}
            data-ocid="login.primary_button"
            className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-white font-medium py-2.5"
          >
            {loginStatus === "logging-in"
              ? "Signing in..."
              : "Sign In with Internet Identity"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
