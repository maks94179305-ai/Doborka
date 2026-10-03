import { createFileRoute } from "@tanstack/react-router";
import { OpeningsView } from "@/components/openings-view";

export const Route = createFileRoute("/")({ component: OpeningsView });
