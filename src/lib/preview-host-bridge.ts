export function installPreviewHostBridge(_opts: { navigate: (path: string) => void; getRoutePaths: () => string[] }) {
  return () => {};
}

export function collectRoutePathsFromTree(_tree: unknown): string[] {
  return [];
}
