import { expect, test, describe } from '@jest/globals';
import { RegexToDFAConverter } from '../RegexToDFA';

describe('Basic RegEx Validation', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  regexToDFA.setRegex('abc');
  test('Valid RegEx passes validation', () => {
    regexToDFA.basicRegexValidation();
    expect(regexToDFA.getRegex()).toBe('abc');
  });

  test('Invalid RegEx throws error', () => {
    regexToDFA.setRegex('[invalid(');
    expect(() => regexToDFA.basicRegexValidation()).toThrow('RegEx "[invalid(" is invalid.');
  });

  test('Leading caret and trailing dollar sign are removed', () => {
    regexToDFA.setRegex('^abc$');
    regexToDFA.basicRegexValidation();
    expect(regexToDFA.getRegex()).toBe('abc');
  });

  test('Escaped trailing dollar sign is not removed', () => {
    regexToDFA.setRegex('abc\\$');
    regexToDFA.basicRegexValidation();
    expect(regexToDFA.getRegex()).toBe('abc\\$');
  });
}); 


describe('Replace shorthand characters in a RegEx', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  test('Shorthand characters are replaced correctly - blank RegEx', () => {
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('');
  });
  test('Shorthand characters are replaced correctly - simple', () => {
    regexToDFA.setRegex('\\d');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[0-9]');
  });
  test('Shorthand characters inside a character class are replaced correctly', () => {
   regexToDFA.setRegex('[\\w]');
   regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[A-Za-z0-9_]');
  });
  test('Escaped dash', () => {
   regexToDFA.setRegex('[1\\-9]');
   regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[19-]');
  });
  test('Escaped closed square bracket', () => {
   regexToDFA.setRegex('a\\]b');
   regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('a]b');
  });
  test('Escaped closed square bracket inside a character class', () => {
   regexToDFA.setRegex('[a\\]b]');
   regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('([ab]|])');
  });
  test('Shorthand characters are replaced correctly - nonsense RegEx', () => {
    regexToDFA.setRegex('97432\\wqpy61 83o5[v254j');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('97432[A-Za-z0-9_]qpy61 83o5[v254j');
  });
  test('Invalid shorthand characters throw an error', () => {
    regexToDFA.setRegex('\\d\\s');
    expect(() => regexToDFA.replaceShorthandCharacters()).toThrow(/^RegEx contains one of the following character classes/);
  });
  test('Escaped exclamation mark', () => {
    regexToDFA.setRegex('[\\!]');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[!]');
  });
  test('Escaped asterisk', () => {
    regexToDFA.setRegex('\\*');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[*]');
  });
  test('Escaped backslash', () => {
    regexToDFA.setRegex('\\\\');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('\\\\');
  });
  test('Full stop inside of a character class is permitted', () => {
    regexToDFA.setRegex('[a.c]');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[a.c]');
  });
  test('Full stop outside of a character class is not permitted', () => {
    regexToDFA.setRegex('.');
    expect(() => regexToDFA.replaceShorthandCharacters()).toThrow(/^RegEx may not contain . outside of a character class/);
  });
  test('Quantifiers throw an error', () => {
    regexToDFA.setRegex('a*b+c?');
    expect(() => regexToDFA.replaceShorthandCharacters()).toThrow(/^RegEx must be of fixed length, and so cannot contain quantifiers like/);
  });
  test('Quantifier characters inside character classes do not throw an error', () => {
    regexToDFA.setRegex('[*][?][+]');
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.getRegex()).toBe('[*][?][+]');
  });
});


describe('Replace literal bracket characters', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  test('Literal ] outside character class is replaced with \\b', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters(']')).toBe('\\b');
  });
  test('Character class [] is not modified', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('[]')).toBe('[]');
  });
  test('Trailing ] is replaced with \\b', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('[]]')).toBe('[]\\b');
  });
  test('Literal [ inside character class is replaced with \\a', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('[[]')).toBe('[\\a]');
  });
  test('Character class [abc] is not modified', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('[abc]')).toBe('[abc]');
  });
  test('Round brackets inside character class are replaced', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('[()]')).toBe('[\\c\\d]');
  });
  test('Otherwise, round brackets are left alone', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('(abc)')).toBe('(abc)');
  });
  test('Curly brackets inside character class are replaced', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('[{}]')).toBe('[\\e\\f]');
  });
  test('Curly brackets which represent valid RegEx counts are left alone', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('a{2}')).toBe('a{2}');
  });
  test('Unless the RegEx count is a range', () => {
    expect(() => regexToDFA.replaceLiteralBracketCharacters('a{2,4}')).toThrow('RegEx must be of fixed length and so may not contain ranges such as {x, y}.');
  });
  test('Curly brackets which do not represent valid RegEx counts are replaced', () => {
    expect(regexToDFA.replaceLiteralBracketCharacters('a{-}')).toBe('a\\e-\\f');
  });
});

describe('Remove RegEx Counts', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  test('Empty RegEx', () => {
    expect(regexToDFA.removeRegexCounts('')).toBe('');
  });
  test('Empty character class', () => {
    expect(() => regexToDFA.removeRegexCounts('[]')).toThrow('RegEx is invalid as it contains the empty character class [].');
  });
  test('RegEx with no counts', () => {
    expect(regexToDFA.removeRegexCounts('abcdef')).toBe('abcdef');
  });
  test('Simple single character repetition', () => {
    expect(regexToDFA.removeRegexCounts('a{3}')).toBe('aaa');
  });
  test('Single character repetition with count of 1', () => {
    expect(regexToDFA.removeRegexCounts('b{1}')).toBe('b');
  });
  test('Character class repetition', () => {
    expect(regexToDFA.removeRegexCounts('[0-9]{2}')).toBe('[0-9][0-9]');
  });
  test('Grouped expression repetition', () => {
    expect(regexToDFA.removeRegexCounts('(ab){2}')).toBe('(ab)(ab)');
  });
  test('Complex grouped expression repetition', () => {
    expect(regexToDFA.removeRegexCounts('(a[0-9]b){3}')).toBe('(a[0-9]b)(a[0-9]b)(a[0-9]b)');
  });
  test('Multiple repetitions in same RegEx', () => {
    expect(regexToDFA.removeRegexCounts('a{2}b{3}')).toBe('aabbb');
  });
  test('Escaped characters inside character classes are preserved', () => {
    expect(regexToDFA.removeRegexCounts('[\\e]a{2}[\\f]')).toBe('[\\e]aa[\\f]');
  });
  test('Multiple special characters inside character classes', () => {
    expect(regexToDFA.removeRegexCounts('[\\e\\f]{2}')).toBe('[\\e\\f][\\e\\f]');
  });
  test('Count of 0', () => {
    expect(regexToDFA.removeRegexCounts('ba{0}c')).toBe('bc');
  });
  test('Nested', () => {
    expect(regexToDFA.removeRegexCounts('([a-z]{2}){3}')).toBe('([a-z][a-z])([a-z][a-z])([a-z][a-z])');
  });
});

describe('Remove Character Classes', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  test('Single character class is preserved', () => {
    expect(regexToDFA.removeCharacterClasses('[!]')).toBe('[!]');
  });
  test('Escaped single character class is preserved', () => {
    expect(regexToDFA.removeCharacterClasses('[\\a]')).toBe('[\\a]');
  });
  test('Multiple characters converted to OR group', () => {
    expect(regexToDFA.removeCharacterClasses('[abc]')).toBe('(a|b|c)');
  });
  test('Digit range 0-9 is expanded', () => {
    expect(regexToDFA.removeCharacterClasses('[0-9]')).toBe('(0|1|2|3|4|5|6|7|8|9)');
  });
  test('Uppercase range A-Z is expanded', () => {
    expect(regexToDFA.removeCharacterClasses('[A-Z]')).toBe('(A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z)');
  });
  test('Partial range 3-8 is expanded', () => {
    expect(regexToDFA.removeCharacterClasses('[3-8]')).toBe('(3|4|5|6|7|8)');
  });
  test('Mix of ranges and characters', () => {
    expect(regexToDFA.removeCharacterClasses('[a-c1]')).toBe('(a|b|c|1)');
  });
  test('Multiple character classes in sequence', () => {
    expect(regexToDFA.removeCharacterClasses('[ab][xy]')).toBe('(a|b)(x|y)');
  });
  test('Character class with surrounding text', () => {
    expect(regexToDFA.removeCharacterClasses('x[ab]y')).toBe('x(a|b)y');
  });
  test('Negated character class throws error', () => {
    expect(() => regexToDFA.removeCharacterClasses('[^abc]')).toThrow(/^RegEx may not contain negated character classes/);
  });
  test('Special character in class throws error', () => {
    expect(() => regexToDFA.removeCharacterClasses('[a*b]')).toThrow(/^RegEx may not contain character classes that provide special characters as a choice/);
  });
  test('Text with no character classes is unchanged', () => {
    expect(regexToDFA.removeCharacterClasses('abc')).toBe('abc');
  });
  test('Multiple ranges in one class', () => {
    expect(regexToDFA.removeCharacterClasses('[0-1a-b]')).toBe('(0|1|a|b)');
  });
});

describe('Expand Range', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  test('0-9 expands to all digits', () => {
    const result = regexToDFA.expandRange('0-9');
    expect(result).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  test('A-Z expands to all uppercase letters', () => {
    const result = regexToDFA.expandRange('A-Z');
    expect(result).toHaveLength(26);
    expect(result[0]).toBe('A');
    expect(result[25]).toBe('Z');
  });

  test('Partial digit range 3-8', () => {
    const result = regexToDFA.expandRange('3-8');
    expect(result).toEqual(['3', '4', '5', '6', '7', '8']);
  });

  test('Partial lowercase range b-f', () => {
    const result = regexToDFA.expandRange('b-f');
    expect(result).toEqual(['b', 'c', 'd', 'e', 'f']);
  });

  test('Single element range 5-5', () => {
    const result = regexToDFA.expandRange('5-5');
    expect(result).toEqual(['5']);
  });

  test('Two adjacent digits 4-5', () => {
    const result = regexToDFA.expandRange('4-5');
    expect(result).toEqual(['4', '5']);
  });
});

describe('Remove Regex Counts and Character Classes', () => {
  const regexToDFA: RegexToDFAConverter = new RegexToDFAConverter();
  test('Empty RegEx', () => {
    regexToDFA.setRegex('');
    regexToDFA.removeRegexCountsAndCharacterClasses();
    expect(regexToDFA.getRegex()).toBe('');
  });
  test('Backslash special character', () => {
    regexToDFA.setRegex('[\\]');
    regexToDFA.removeRegexCountsAndCharacterClasses();
    expect(regexToDFA.getRegex()).toBe('[\\]');
  });
  test('Complex test 1', () => {
    regexToDFA.setRegex('[a-g]{2}');
    regexToDFA.removeRegexCountsAndCharacterClasses();
    expect(regexToDFA.getRegex()).toBe('(a|b|c|d|e|f|g)(a|b|c|d|e|f|g)');
  });
  test('Complex test 2', () => {
    regexToDFA.setRegex('[[]{2}{[0-4J-K]{1}');
    regexToDFA.removeRegexCountsAndCharacterClasses();
    expect(regexToDFA.getRegex()).toBe('[[][[]{(0|1|2|3|4|J|K)');
  });
});



