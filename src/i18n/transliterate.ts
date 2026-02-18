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

const digraphs = new Set(['Љ', 'љ', 'Њ', 'њ', 'Џ', 'џ']);

function isAllCapsContext(prev: string, next: string): boolean {
  const surrounding = prev + next;
  const cyrillicLetters = surrounding.match(/[\u0400-\u04FF]/g);
  if (!cyrillicLetters || cyrillicLetters.length === 0) return false;
  return cyrillicLetters.every(
    (ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase(),
  );
}

export function transliterate(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (digraphs.has(char)) {
      const mapped = cyrillicToLatinMap[char];
      if (char === char.toUpperCase() && char !== char.toLowerCase()) {
        const prev = text.slice(0, i);
        const next = text.slice(i + 1);
        if (isAllCapsContext(prev, next)) {
          result += mapped.toUpperCase();
        } else {
          result += mapped;
        }
      } else {
        result += mapped;
      }
      i++;
      continue;
    }

    if (cyrillicToLatinMap[char] !== undefined) {
      result += cyrillicToLatinMap[char];
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}
