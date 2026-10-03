import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/app-shell";
import appCss from "../styles.css?url";

const APP_NAME = "Доборка";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#161618" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: Root,
});

function Root() {
  const native = typeof window !== "undefined" && "Capacitor" in window;
  if (native) {
    return (
      <div className="min-h-dvh bg-background text-foreground antialiased">
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </div>
    );
  }
  return (
    <html lang="ru" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <AppShell />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
