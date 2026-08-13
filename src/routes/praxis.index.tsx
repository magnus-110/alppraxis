import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/praxis/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/praxis/heute" });
  },
});
