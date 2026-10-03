export function migrationName(path) {
  return String(path).split("/").pop() ?? "";
}
export function isMigrationFile(path) {
  return /\.(sql|ts)$/.test(String(path));
}
export function pendingMigrations(paths, applied) {
  const done = new Set(applied ?? []);
  return (paths ?? []).filter((p) => !done.has(migrationName(p)));
}
