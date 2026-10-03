import { createFileRoute } from "@tanstack/react-router";
import { ExtrasView } from "@/components/extras-view";

export const Route = createFileRoute("/elementy")({ component: ExtrasView });
