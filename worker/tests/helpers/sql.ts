export function splitSql(raw: string): string[] {
  return raw
    .split(';\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== ';')
    .map((s) => (s.endsWith(';') ? s : s + ';'));
}
