export function isMermaidValid(text) {
  if (!text.includes("graph") && !text.includes("erDiagram")) return false;

  const nodeRegex = /(\[\s?.+?\s?\]|[A-Za-z_][\w-]*)/g;
  const edges = [...text.matchAll(/([A-Za-z0-9_\[\]\s]+)--?>+([A-Za-z0-9_\[\]\s]+)/g)];

  const defined = new Set([...text.matchAll(nodeRegex)].map(m => m[0].trim()));

  return edges.every(([ , from, to ]) => defined.has(from.trim()) && defined.has(to.trim()));
}
