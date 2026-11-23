import type { Operation } from '../../lib/types';

/** Display symbols for operators (data keeps '-', '*', '/'). */
export const OP_SYMBOLS: Record<Operation, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': ':',
};

export function opSymbol(op: string): string {
  return OP_SYMBOLS[op as Operation] ?? op;
}

/** Replace `{name}` placeholders in a translated template. */
export function fillTemplate(template: string, params: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.split(`{${key}}`).join(String(value));
  }
  return result;
}

/** Template with `{n}` → filled; template without it → "template n". */
export function withNumber(template: string, n: number): string {
  return template.includes('{n}') ? fillTemplate(template, { n }) : `${template} ${n}`;
}

/** Translation with a fallback when the key is missing (t returns the key itself). */
export function tOr(t: (key: string) => string, key: string, fallback: string): string {
  const value = t(key);
  return value === key ? fallback : value;
}
