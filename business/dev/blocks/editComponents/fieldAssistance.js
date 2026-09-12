export function variableNames(workflow = {}) {
  const nodes = workflow.drawflow?.nodes || workflow.nodes || [];
  const names = nodes.flatMap(({ data = {} }) => [
    data.assignVariable ? data.variableName : null,
    data.variableStoreName,
    data.resourceName,
  ]);
  return [
    ...new Set(
      names.filter(
        (name) => typeof name === 'string' && /^[A-Za-z0-9_$:.-]+$/.test(name)
      )
    ),
  ].sort();
}

export function references(value) {
  return [
    ...new Set(
      String(value ?? '').match(
        /\[\[\s*[A-Za-z0-9_$:.-]+\s*\]\]|\{\{\s*variables\.[\w$.-]+\s*\}\}/g
      ) || []
    ),
  ];
}

export function jsonIssue(value, shape = 'any') {
  if (!String(value ?? '').trim()) return '';
  try {
    const parsed = JSON.parse(value);
    if (
      shape === 'object' &&
      (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    )
      return 'object';
    if (shape === 'array' && !Array.isArray(parsed)) return 'array';
    return '';
  } catch {
    // Whole-value templates are resolved at runtime, not while editing.
    if (
      /^(\[\[\s*[A-Za-z0-9_$:.-]+\s*\]\]|\{\{[^{}]+\}\})$/.test(
        String(value).trim()
      )
    )
      return '';
    return 'json';
  }
}
