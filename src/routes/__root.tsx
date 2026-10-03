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
      { name: "description", content: "Офлайн-расчёт откосов, доборных элементов и раскроя хлыстов" },
      { name: "theme-color", content: "#161618" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico?v=pc", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png?v=pc" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png?v=pc" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/icon-180.png?v=pc" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="ru" className="antialiased" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: "#boot-splash{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.75rem;background:#161618;transition:opacity .28s ease}#boot-splash img{width:7.25rem;height:7.25rem;border-radius:1.6rem;box-shadow:0 18px 40px rgba(0,0,0,.45)}#boot-splash p{margin:0;font-family:Unbounded,Manrope,sans-serif;font-size:2.35rem;font-weight:500;letter-spacing:-.03em;color:#f3f1ec}html.app-ready #boot-splash{opacity:0;pointer-events:none}" }} />
        <HeadContent />
      </head>
      <body>
        <div id="boot-splash" aria-hidden="true">
          <img src="/icon-512.png?v=pc" alt="" />
          <p>Доборка</p>
        </div>
        <PreviewHostBridge />
        <AuthProvider>
          <AppShell />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
