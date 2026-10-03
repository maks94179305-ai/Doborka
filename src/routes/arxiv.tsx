import { createFileRoute } from "@tanstack/react-router";
import { ArchiveView } from "@/components/archive-view";

export const Route = createFileRoute("/arxiv")({ component: ArchiveView });
