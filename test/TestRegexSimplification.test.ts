import { expect, test, describe } from '@jest/globals';
import { RegexToDFA } from '../src/RegexToDFA';

describe('Basic RegEx Validation', () => {
  const regexToDFA: RegexToDFA = new RegexToDFA('abc');
  test('Valid RegEx passes validation', () => {
    regexToDFA.basicRegexValidation();
    expect(regexToDFA.regex).toBe('abc');
  });

  test('Invalid RegEx throws error', () => {
    regexToDFA.regex = '[invalid(';
    expect(() => regexToDFA.basicRegexValidation()).toThrow('RegEx "[invalid(" is invalid.');
  });

  test('Leading caret and trailing dollar sign are removed', () => {
    regexToDFA.regex = '^abc$';
    regexToDFA.basicRegexValidation();
    expect(regexToDFA.regex).toBe('abc');
  });

  test('Escaped trailing dollar sign is not removed', () => {
    regexToDFA.regex = 'abc\\$';
    regexToDFA.basicRegexValidation();
    expect(regexToDFA.regex).toBe('abc\\$');
  });
}); 


describe('Relace shorthand characters in a RegEx', () => {
  const regexToDFA: RegexToDFA = new RegexToDFA('');
  test('Shorthand characters are replaced correctly - blank RegEx', () => {
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.regex).toBe('');
  });
  test('Shorthand characters are replaced correctly - simple', () => {
    regexToDFA.regex = '\\d';
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.regex).toBe('[0-9]');
  });
  test('Shorthand characters are replaced correctly - complex but valid RegEx', () => {
   regexToDFA.regex = '\\d';
   regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.regex).toBe('[0-9]');
  });
  test('Shorthand characters are replaced correctly - nonsense RegEx', () => {
    regexToDFA.regex = '97432\\Sqpy61 83o5[v254j';
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.regex).toBe('97432[A-Za-z0-9_]qpy61 83o5[v254j');
  });
  test('Invalid shorthand characters throw an error', () => {
    regexToDFA.regex = '\\d\\u\\s';
    expect(() => regexToDFA.replaceShorthandCharacters()).toThrow(/^RegEx must not contain any escaped characters, except for the following shorthand character classes/);
  });
  test('Full stops are replaced correctly', () => {
    regexToDFA.regex = '..[.]';
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.regex).toBe('[0-9A-Za-z_][0-9A-Za-z_][.]');
  });
  test('Quantifiers throw an error', () => {
    regexToDFA.regex = 'a*b+c?';
    expect(() => regexToDFA.replaceShorthandCharacters()).toThrow(/^RegEx must be of fixed length, and so cannot contain quantifiers like/);
  });
  test('Quantifier characters inside character classes do not throw an error', () => {
    regexToDFA.regex = '[*][?][+]';
    regexToDFA.replaceShorthandCharacters();
    expect(regexToDFA.regex).toBe('[*][?][+]');
  });
});


describe('Remove RegEx Counts', () => {
  const regexToDFA: RegexToDFA = new RegexToDFA('');
  test('Empty RegEx', () => {
    regexToDFA.regex = '';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('');
  });
  test('RegEx with no counts', () => {
    regexToDFA.regex = 'abcdef';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('abcdef');
  });
  test('Simple single character repetition', () => {
    regexToDFA.regex = 'a{3}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('aaa');
  });
  test('Single character repetition with count of 1', () => {
    regexToDFA.regex = 'b{1}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('b');
  });
  test('Character class repetition', () => {
    regexToDFA.regex = '[0-9]{2}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('[0-9][0-9]');
  });
  test('Grouped expression repetition', () => {
    regexToDFA.regex = '(ab){2}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('(ab)(ab)');
  });
  test('Complex grouped expression repetition', () => {
    regexToDFA.regex = '(a[0-9]b){3}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('(a[0-9]b)(a[0-9]b)(a[0-9]b)');
  });
  test('Multiple repetitions in same RegEx', () => {
    regexToDFA.regex = 'a{2}b{3}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('aabbb');
  });
  test('Curly braces inside character classes are preserved', () => {
    regexToDFA.regex = '[{]a{2}[}]';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('[{]aa[}]');
  });
  test('Multiple curly braces inside character classes', () => {
    regexToDFA.regex = '[{}]{2}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('[{}][{}]');
  });
  test('Count of 0', () => {
    regexToDFA.regex = 'ba{0}c';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('bc');
  });
  test('Range syntax throws error', () => {
    regexToDFA.regex = 'a{2,4}';
    expect(() => regexToDFA.removeRegexCounts()).toThrow('RegEx must be of fixed length and so may not contain ranges such as {x, y}.');
  });
  test('Range with comma throws error', () => {
    regexToDFA.regex = 'a{1,}';
    expect(() => regexToDFA.removeRegexCounts()).toThrow('RegEx must be of fixed length and so may not contain ranges such as {x, y}.');
  });
  test('Square brace inside character class', () => {
    regexToDFA.regex = '[[]{2}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('[[][[]');
  });
  test('Curly and round braces inside character class', () => {
    regexToDFA.regex = '[}({})]{2}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('[}({})][}({})]');
  });
  test('Curly braces intended as literals', () => {
    regexToDFA.regex = '({})';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('({})');
  });
  test('Right curly brace only', () => {
    regexToDFA.regex = '}{2}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('}}');
  });
  test('Three braces', () => {
    regexToDFA.regex = '{{}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('{{}');
  });
  test('Negative number between braces', () => {
    regexToDFA.regex = 'a{-1}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('a{-1}');
  });
  test('Nested', () => {
    regexToDFA.regex = '([a-z]{2}){3}';
    regexToDFA.removeRegexCounts();
    expect(regexToDFA.regex).toBe('([a-z][a-z])([a-z][a-z])([a-z][a-z])');
  });
});

