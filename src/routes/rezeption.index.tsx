import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rezeption/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/rezeption/buchen" });
  },
});
