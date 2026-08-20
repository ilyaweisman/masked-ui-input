import { expect, test, describe } from '@jest/globals';
import { RegexSimplifier } from '../RegexSimplifier';

describe('Basic RegEx Validation', () => {
  test('Valid RegEx passes validation', () => {
    expect(RegexSimplifier.basicRegexValidation('abc')).toBe('abc');
  });

  test('Invalid RegEx throws error', () => {
    expect(() => RegexSimplifier.basicRegexValidation('[invalid(')).toThrow('RegEx "[invalid(" is invalid.');
  });

  test('Leading caret and trailing dollar sign are removed', () => {
    expect(RegexSimplifier.basicRegexValidation('^abc$')).toBe('abc');
  });

  test('Escaped trailing dollar sign is not removed', () => {
    expect(RegexSimplifier.basicRegexValidation('abc\\$')).toBe('abc\\$');
  });
}); 


describe('Replace shorthand characters in a RegEx', () => {
  test('Shorthand characters are replaced correctly - blank RegEx', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('')).toBe('');
  });
  test('Shorthand characters are replaced correctly - simple', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('\\d')).toBe('[0-9]');
  });
  test('Shorthand characters inside a character class are replaced correctly', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('[\\w]')).toBe('[A-Za-z0-9_]');
  });
  test('Escaped dash', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('[1\\-9]')).toBe('[19-]');
  });
  test('Escaped closed square bracket', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('a\\]b')).toBe('a]b');
  });
  test('Escaped closed square bracket inside a character class', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('[a\\]b]')).toBe('([ab]|])');
  });
  test('Shorthand characters are replaced correctly - nonsense RegEx', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('97432\\wqpy61 83o5[v254j')).toBe('97432[A-Za-z0-9_]qpy61 83o5[v254j');
  });
  test('Invalid shorthand characters throw an error', () => {
    expect(() => RegexSimplifier.replaceShorthandCharacters('\\d\\s')).toThrow(/^RegEx contains one of the following character classes/);
  });
  test('Escaped exclamation mark', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('[\\!]')).toBe('[!]');
  });
  test('Escaped asterisk', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('\\*')).toBe('[*]');
  });
  test('Escaped backslash', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('\\\\')).toBe('\\\\');
  });
  test('Full stop inside of a character class is permitted', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('[a.c]')).toBe('[a.c]');
  });
  test('Full stop outside of a character class is not permitted', () => {
    expect(() => RegexSimplifier.replaceShorthandCharacters('.')).toThrow(/^RegEx may not contain . outside of a character class/);
  });
  test('Quantifiers throw an error', () => {
    expect(() => RegexSimplifier.replaceShorthandCharacters('a*b+c?')).toThrow(/^RegEx must be of fixed length, and so cannot contain quantifiers like/);
  });
  test('Quantifier characters inside character classes do not throw an error', () => {
    expect(RegexSimplifier.replaceShorthandCharacters('[*][?][+]')).toBe('[*][?][+]');
  });
});


describe('Replace literal bracket characters', () => {
  test('Literal ] outside character class is replaced with \\b', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters(']')).toBe('\\b');
  });
  test('Character class [] is not modified', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('[]')).toBe('[]');
  });
  test('Trailing ] is replaced with \\b', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('[]]')).toBe('[]\\b');
  });
  test('Literal [ inside character class is replaced with \\a', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('[[]')).toBe('[\\a]');
  });
  test('Character class [abc] is not modified', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('[abc]')).toBe('[abc]');
  });
  test('Round brackets inside character class are replaced', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('[()]')).toBe('[\\c\\d]');
  });
  test('Otherwise, round brackets are left alone', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('(abc)')).toBe('(abc)');
  });
  test('Curly brackets inside character class are replaced', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('[{}]')).toBe('[\\e\\f]');
  });
  test('Curly brackets which represent valid RegEx counts are left alone', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('a{2}')).toBe('a{2}');
  });
  test('Unless the RegEx count is a range', () => {
    expect(() => RegexSimplifier.replaceLiteralBracketCharacters('a{2,4}')).toThrow('RegEx must be of fixed length and so may not contain ranges such as {x, y}.');
  });
  test('Curly brackets which do not represent valid RegEx counts are replaced', () => {
    expect(RegexSimplifier.replaceLiteralBracketCharacters('a{-}')).toBe('a\\e-\\f');
  });
});

describe('Remove RegEx Counts', () => {
  test('Empty RegEx', () => {
    expect(RegexSimplifier.removeRegexCounts('')).toBe('');
  });
  test('Empty character class', () => {
    expect(() => RegexSimplifier.removeRegexCounts('[]')).toThrow('RegEx is invalid as it contains the empty character class [].');
  });
  test('RegEx with no counts', () => {
    expect(RegexSimplifier.removeRegexCounts('abcdef')).toBe('abcdef');
  });
  test('Simple single character repetition', () => {
    expect(RegexSimplifier.removeRegexCounts('a{3}')).toBe('aaa');
  });
  test('Single character repetition with count of 1', () => {
    expect(RegexSimplifier.removeRegexCounts('b{1}')).toBe('b');
  });
  test('Character class repetition', () => {
    expect(RegexSimplifier.removeRegexCounts('[0-9]{2}')).toBe('[0-9][0-9]');
  });
  test('Grouped expression repetition', () => {
    expect(RegexSimplifier.removeRegexCounts('(ab){2}')).toBe('(ab)(ab)');
  });
  test('Complex grouped expression repetition', () => {
    expect(RegexSimplifier.removeRegexCounts('(a[0-9]b){3}')).toBe('(a[0-9]b)(a[0-9]b)(a[0-9]b)');
  });
  test('Multiple repetitions in same RegEx', () => {
    expect(RegexSimplifier.removeRegexCounts('a{2}b{3}')).toBe('aabbb');
  });
  test('Escaped characters inside character classes are preserved', () => {
    expect(RegexSimplifier.removeRegexCounts('[\\e]a{2}[\\f]')).toBe('[\\e]aa[\\f]');
  });
  test('Multiple special characters inside character classes', () => {
    expect(RegexSimplifier.removeRegexCounts('[\\e\\f]{2}')).toBe('[\\e\\f][\\e\\f]');
  });
  test('Count of 0', () => {
    expect(RegexSimplifier.removeRegexCounts('ba{0}c')).toBe('bc');
  });
  test('Nested', () => {
    expect(RegexSimplifier.removeRegexCounts('([a-z]{2}){3}')).toBe('([a-z][a-z])([a-z][a-z])([a-z][a-z])');
  });
});

describe('Remove Character Classes', () => {
  test('Single character class is preserved', () => {
    expect(RegexSimplifier.removeCharacterClasses('[!]')).toBe('[!]');
  });
  test('Escaped single character class is preserved', () => {
    expect(RegexSimplifier.removeCharacterClasses('[\\a]')).toBe('[\\a]');
  });
  test('Multiple characters converted to OR group', () => {
    expect(RegexSimplifier.removeCharacterClasses('[abc]')).toBe('(a|b|c)');
  });
  test('Digit range 0-9 is expanded', () => {
    expect(RegexSimplifier.removeCharacterClasses('[0-9]')).toBe('(0|1|2|3|4|5|6|7|8|9)');
  });
  test('Uppercase range A-Z is expanded', () => {
    expect(RegexSimplifier.removeCharacterClasses('[A-Z]')).toBe('(A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z)');
  });
  test('Partial range 3-8 is expanded', () => {
    expect(RegexSimplifier.removeCharacterClasses('[3-8]')).toBe('(3|4|5|6|7|8)');
  });
  test('Mix of ranges and characters', () => {
    expect(RegexSimplifier.removeCharacterClasses('[a-c1]')).toBe('(a|b|c|1)');
  });
  test('Multiple character classes in sequence', () => {
    expect(RegexSimplifier.removeCharacterClasses('[ab][xy]')).toBe('(a|b)(x|y)');
  });
  test('Character class with surrounding text', () => {
    expect(RegexSimplifier.removeCharacterClasses('x[ab]y')).toBe('x(a|b)y');
  });
  test('Negated character class throws error', () => {
    expect(() => RegexSimplifier.removeCharacterClasses('[^abc]')).toThrow(/^RegEx may not contain negated character classes/);
  });
  test('Special character in class throws error', () => {
    expect(() => RegexSimplifier.removeCharacterClasses('[a*b]')).toThrow(/^RegEx may not contain character classes that provide special characters as a choice/);
  });
  test('Text with no character classes is unchanged', () => {
    expect(RegexSimplifier.removeCharacterClasses('abc')).toBe('abc');
  });
  test('Multiple ranges in one class', () => {
    expect(RegexSimplifier.removeCharacterClasses('[0-1a-b]')).toBe('(0|1|a|b)');
  });
});

describe('Expand Range', () => {
  test('0-9 expands to all digits', () => {
    const result: string[] = RegexSimplifier.expandRange('0-9');
    expect(result).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });

  test('A-Z expands to all uppercase letters', () => {
    const result: string[] = RegexSimplifier.expandRange('A-Z');
    expect(result).toHaveLength(26);
    expect(result[0]).toBe('A');
    expect(result[25]).toBe('Z');
  });

  test('Partial digit range 3-8', () => {
    const result: string[] = RegexSimplifier.expandRange('3-8');
    expect(result).toEqual(['3', '4', '5', '6', '7', '8']);
  });

  test('Partial lowercase range b-f', () => {
    const result: string[] = RegexSimplifier.expandRange('b-f');
    expect(result).toEqual(['b', 'c', 'd', 'e', 'f']);
  });

  test('Single element range 5-5', () => {
    const result: string[] = RegexSimplifier.expandRange('5-5');
    expect(result).toEqual(['5']);
  });

  test('Two adjacent digits 4-5', () => {
    const result: string[] = RegexSimplifier.expandRange('4-5');
    expect(result).toEqual(['4', '5']);
  });
});

describe('Remove Regex Counts and Character Classes', () => {
  test('Empty RegEx', () => {
    expect(RegexSimplifier.removeRegexCountsAndCharacterClasses('')).toBe('');
  });
  test('Backslash special character', () => {
    expect(RegexSimplifier.removeRegexCountsAndCharacterClasses('[\\]')).toBe('[\\]');
  });
  test('Complex test 1', () => {
    expect(RegexSimplifier.removeRegexCountsAndCharacterClasses('[a-g]{2}')).toBe('(a|b|c|d|e|f|g)(a|b|c|d|e|f|g)');
  });
  test('Complex test 2', () => {
    expect(RegexSimplifier.removeRegexCountsAndCharacterClasses('[[]{2}{[0-4J-K]{1}')).toBe('[[][[]{(0|1|2|3|4|J|K)');
  });
});

describe('Simplify RegEx', () => {
  test('Empty RegEx', () => {
    expect(RegexSimplifier.simplifyRegex('')).toBe('');
  });
  test('Invalid RegEx', () => {
    expect(() => RegexSimplifier.simplifyRegex('[9-3]')).toThrow('RegEx "[9-3]" is invalid.');
  });
  test('Simple RegEx', () => {
    expect(RegexSimplifier.simplifyRegex('[A-D]{2}')).toBe('(A|B|C|D)(A|B|C|D)');
  });
  test('Complex RegEx', () => {
    const regex: string = '^(0[1-9]|[12]\\d|3[01])/(0[1-9]|1[012])/\\d{4}$';
    const simplifiedRegex: string = RegexSimplifier.simplifyRegex(regex);
    expect(simplifiedRegex).toBe(`(0(1|2|3|4|5|6|7|8|9)|(1|2)(0|1|2|3|4|5|6|7|8|9)|3(0|1))/(0(1|2|3|4|5|6|7|8|9)|1(0|1|2))/(0|1|2|3|4|5|6|7|8|9)(0|1|2|3|4|5|6|7|8|9)(0|1|2|3|4|5|6|7|8|9)(0|1|2|3|4|5|6|7|8|9)`);
  });
});

describe('Substitute Brackets for Escaped Characters', () => {
  test('Empty RegEx', () => {
    expect(RegexSimplifier.substituteBracketsForEscapedCharacters('')).toBe('');
  });
  test('No substitution needed', () => {
    expect(RegexSimplifier.substituteBracketsForEscapedCharacters('abc')).toBe('abc');
  });
  test('Substitutes escaped characters with brackets', () => {
    expect(RegexSimplifier.substituteBracketsForEscapedCharacters('\\a\\b\\c\\d\\e\\f\\g')).toBe('[](){}|');
  });
});


