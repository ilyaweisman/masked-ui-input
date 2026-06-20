import { expect, test, describe } from '@jest/globals';
import { RegexToDFA } from './RegexToDFA';

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
    expect(() => regexToDFA.replaceShorthandCharacters()).toThrow('RegEx must not contain any shorthand character classes except \\\\d, \\\\D, \\\\s, \\\\S and \\\\w.');
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
  test('Quantifier charactetrs which are escaped with a backslash do not throw an error', () => {
    regexToDFA.regex = '\*\?\+';
    expect(regexToDFA.regex).toBe('\*\?\+');
  });
  test('Quantifier characters inside character classes do not throw an error', () => {
    regexToDFA.regex = '[*][?][+]';
    expect(regexToDFA.regex).toBe('[*][?][+]');
  });
});

