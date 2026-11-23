export const cyrillicToLatinMap: Record<string, string> = {
  'Љ': 'Lj', 'љ': 'lj',
  'Њ': 'Nj', 'њ': 'nj',
  'Џ': 'Dž', 'џ': 'dž',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ',
  'Е': 'E', 'Ж': 'Ž', 'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K',
  'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
  'С': 'S', 'Т': 'T', 'Ћ': 'Ć', 'У': 'U', 'Ф': 'F', 'Х': 'H',
  'Ц': 'C', 'Ч': 'Č', 'Ш': 'Š',
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ',
  'е': 'e', 'ж': 'ž', 'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k',
  'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'ћ': 'ć', 'у': 'u', 'ф': 'f', 'х': 'h',
  'ц': 'c', 'ч': 'č', 'ш': 'š',
};

/** Uppercase Cyrillic letters that map to two Latin letters. */
const upperDigraphs = new Set(['Љ', 'Њ', 'Џ']);

const isLetter = (ch: string) => ch.toLowerCase() !== ch.toUpperCase();
const isUpper = (ch: string) => isLetter(ch) && ch === ch.toUpperCase();

/**
 * True when the word containing position `i` (a run of letters) is written in
 * all caps and has at least one other letter. A lone capital digraph ("Њ") or
 * one starting a title-case word ("Љиљана") is not all-caps.
 */
function isAllCapsWord(text: string, i: number): boolean {
  let start = i;
  while (start > 0 && isLetter(text[start - 1])) start--;
  let end = i + 1;
  while (end < text.length && isLetter(text[end])) end++;
  if (end - start < 2) return false;
  for (let j = start; j < end; j++) {
    if (!isUpper(text[j])) return false;
  }
  return true;
}

export function transliterate(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const mapped = cyrillicToLatinMap[char];
    if (mapped === undefined) {
      result += char;
    } else if (upperDigraphs.has(char) && isAllCapsWord(text, i)) {
      result += mapped.toUpperCase();
    } else {
      result += mapped;
    }
  }
  return result;
}
