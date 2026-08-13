/// <reference types="vite/client" />
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import styles from "@/styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Alppraxis – Termine" },
      {
        name: "description",
        content:
          "Terminbuchung der Alppraxis – Privatpraxis für Physiotherapie und Naturheilkunde in Pfronten und Roßhaupten.",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: RootDocument,
});

function RootDocument() {
  const context = Route.useRouteContext();
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={context.queryClient}>
          <Outlet />
          <Toaster position="top-center" richColors closeButton />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
