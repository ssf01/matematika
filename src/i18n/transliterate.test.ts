import { describe, it, expect } from 'vitest';
import { transliterate } from './transliterate';

describe('transliterate', () => {
  it('transliterates basic Cyrillic to Latin', () => {
    expect(transliterate('Математика')).toBe('Matematika');
  });

  it('handles lowercase', () => {
    expect(transliterate('здраво')).toBe('zdravo');
  });

  it('transliterates digraph Љ correctly', () => {
    expect(transliterate('Љубав')).toBe('Ljubav');
    expect(transliterate('љубав')).toBe('ljubav');
  });

  it('transliterates digraph Њ correctly', () => {
    expect(transliterate('Његош')).toBe('Njegoš');
    expect(transliterate('његош')).toBe('njegoš');
  });

  it('transliterates digraph Џ correctly', () => {
    expect(transliterate('Џак')).toBe('Džak');
    expect(transliterate('џак')).toBe('džak');
  });

  it('preserves non-Cyrillic characters', () => {
    expect(transliterate('123 abc!')).toBe('123 abc!');
  });

  it('transliterates mixed content', () => {
    expect(transliterate('ПИН: 1234')).toBe('PIN: 1234');
  });

  it('handles empty string', () => {
    expect(transliterate('')).toBe('');
  });

  it('handles special Serbian letters', () => {
    expect(transliterate('Ђ')).toBe('Đ');
    expect(transliterate('ђ')).toBe('đ');
    expect(transliterate('Ћ')).toBe('Ć');
    expect(transliterate('ћ')).toBe('ć');
    expect(transliterate('Ж')).toBe('Ž');
    expect(transliterate('ж')).toBe('ž');
    expect(transliterate('Ш')).toBe('Š');
    expect(transliterate('ш')).toBe('š');
    expect(transliterate('Ч')).toBe('Č');
    expect(transliterate('ч')).toBe('č');
  });

  it('transliterates full sentences', () => {
    expect(transliterate('Реши задатке, откључај ТВ!'))
      .toBe('Reši zadatke, otključaj TV!');
  });

  it('handles all-caps with digraphs', () => {
    // When surrounding context is all-caps, digraphs should be all-caps too
    expect(transliterate('ЉУБАВ')).toBe('LJUBAV');
    expect(transliterate('ЊЕГА')).toBe('NJEGA');
  });
});
