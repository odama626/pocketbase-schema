export function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

export function pascalCase(text: string): string {
  if (typeof text !== 'string') return text;
  return text
    .split(/[\-\_\:]/)
    .filter(Boolean)
    .map(capitalize)
    .join('');
}

export function camelCase(text: string): string {
  if (typeof text !== 'string') return text;
  let pieces = text.split(/[\-\_]/).filter(Boolean);
  return pieces[0] + pieces.slice(1).map(capitalize).join('');
}
