export class RegexSimplifier {

    // Define arrays of uppercase letters, lowercase letters and digits.
    static readonly ALPHA: number[] = Array.from(Array(26).keys()).map((i) => i + 65);
    static readonly UPPERCASE_LETTERS: string[] = this.ALPHA.map((x) => String.fromCharCode(x));
    static readonly LOWERCASE_LETTERS: string[] = this.ALPHA.map((x) => String.fromCharCode(x + 32));
    static readonly DIGITS: string[] = Array.from(Array(10).keys()).map((x) => x.toString());

    /**
     * Checks if the RegEx is valid. Removes start and end anchors from the RegEx.
     */
    static basicRegexValidation(regex: string): string {
        try {
            new RegExp(regex);
        } catch (e) {
            throw new Error('RegEx "' + regex + '" is invalid.');
        }
        let rgx: string = regex;
        if (rgx.startsWith('^')) {
            rgx = rgx.substring(1, rgx.length);
        }  
        if (rgx.endsWith('$') && rgx.charAt(rgx.length - 2) !== '\\') {
            rgx = rgx.substring(0, rgx.length - 1);
        }
        return rgx;
    }

    /**
     * Replaces all shorthand character classes in the RegEx with corresponding expanded character classes.
     * Throws an error if the RegEx contains *, + or ?, as that would make it not fixed-length.
     * Throws an error if the RegEx contains ., as only word characters are permitted unless singly specified inside a character class.
     */
    static replaceShorthandCharacters(regex: string): string {
        let rgx: string = regex;

        if (rgx.charAt(0) === '|' || rgx.charAt(rgx.length - 1) === '|') {
            throw new Error('RegEx must be fixed-length and therefore may not start or end with a | character.');
        }

        if (rgx.includes('\\D') || rgx.includes('\\W') || rgx.includes('\\s') || rgx.includes('\\S')) {
            throw new Error(`RegEx contains one of the following character classes: \\D, \\W, \\s or \\S. 
                These character classes are not permitted, as they allow for a free choice in special characters at a given position.`);
        }

        let insideBrackets: boolean = false;
        let bracketIndex: number = -1;
        let addADash: boolean = false;
        let replaceCharcaterClassWithRightBracket: boolean = false;
        let ind: number = 0;
        // Replace shorthand characters outside of character classes with a character class, e.g. \\d -> [0-9].
        // Replace shorthand characters inside of character classes with a range, e.g. [a\\dc] -> [a0-9c].
        // Replace all full stops (.) outside of character classes with [A-Za-z0-9_].
       while (ind < rgx.length) {
            const char: string = rgx.charAt(ind);
            if (char === '[') {
                if (!insideBrackets) {
                    bracketIndex = ind;
                }
                insideBrackets = true;
            }
            if (char === ']') {
                if (replaceCharcaterClassWithRightBracket) {
                    rgx = `${rgx.substring(0, bracketIndex)}(${rgx.substring(bracketIndex, ind + 1)}|])${rgx.substring(ind + 1)}`;
                    replaceCharcaterClassWithRightBracket = false;
                }
                else if (addADash) {
                    rgx = `${rgx.substring(0, ind)}-${rgx.substring(ind)}`;
                    addADash = false;
                }
                insideBrackets = false;
            }
            if (char === '\\') {
                const charAfter: string = rgx.charAt(ind + 1);
                // Ignore escaped backslash - there is no other way of representing this, so we have to account 
                // for it in the syntax tree code instead.
                if (charAfter === '\\') {
                    ind += 2;
                    continue;
                }
                let replacement: string = charAfter;
                if (charAfter === 'd') {
                    replacement = insideBrackets ? '0-9' : '[0-9]';
                }
                else if (charAfter === 'w') {
                    replacement = insideBrackets ? 'A-Za-z0-9_' : '[A-Za-z0-9_]';
                }
                // Need to account for special characters - and ] as they can have a different meaning inside of a character class.
                else if (charAfter === '-' && insideBrackets) {
                    replacement = '';
                    addADash = true;
                }
                else if (charAfter === ']') {
                    if (insideBrackets) {
                        replacement = '';
                        replaceCharcaterClassWithRightBracket = true;
                    } else {
                        replacement = ']';
                    }
                }
                // All other escaped characters are literal characters. Replace these with a character class.
                else {  
                    replacement = insideBrackets ? charAfter : `[${charAfter}]`;
                    insideBrackets = true;
                }
                rgx = `${rgx.substring(0, ind)}${replacement}${rgx.substring(ind + 2)}`;
            }
            if (char === '.' && !insideBrackets) {
                throw new Error('RegEx may not contain . outside of a character class. Any non-word characters must be singly specified.');
            }
            // RegEx may not contain *, + or ? outside of a character class.
            if ((char === '*' || char === '+' || char === '?' || char === '.') && !insideBrackets) {
                throw new Error(`RegEx must be of fixed length, and so cannot contain quantifiers like *, + or ?. If you wanted to match 
                    these characters instead of using them as quantifiers, place them in character classes: [*], [+], or [?].`);
            }
            ind++;
        }
        return rgx;
    }

    /**
     * Replaces all the regex counts and character classes in the RegEx with their expanded forms.
     * @returns the regex (still contains temporary escaped characters)
     */
    static removeRegexCountsAndCharacterClasses(regex: string): string {
        let rgx: string = this.replaceLiteralBracketCharacters(regex);
        rgx = this.removeRegexCounts(rgx);
        rgx = this.removeCharacterClasses(rgx); // TODO: Use this value of RegEx to convert to a syntax tree.
        // Replace the temporary characters with the curly braces again.
        rgx = this.substituteBracketsForEscapedCharacters(rgx);
        return rgx;
    }

    /** 
     * In the RegEx, replace any bracket characters which are meant to be interpreted as literals with temporary characters.
     * [, ], (, ), {, }, | replaced with \a, \b, \c, \d, \e, \f and \g.
     * @param rgx The RegEx provided.
     * @returns The RegEx, with it's literal bracket characters replaced escaped characters.
     */
    static replaceLiteralBracketCharacters(regex: string): string {
        let rgx: string = regex;

        let i: number = 0;
        let insideCharacterClass: boolean = false;
        let leftBraceIndex: number = -1;
        while (i < rgx.length) {
            let character: string = rgx.charAt(i);
            if (character === '[') {
                if (!insideCharacterClass) {
                    insideCharacterClass = true;
                } else {
                    rgx = `${rgx.substring(0, i)}\\a${rgx.substring(i + 1)}`;
                    i++;
                }
            }
            if (character === ']') {
                if (!insideCharacterClass) {
                    rgx = `${rgx.substring(0, i)}\\b${rgx.substring(i + 1)}`;
                    i++;
                } else {
                    insideCharacterClass = false;
                }   
            }
            if (character === '(') {
                if (insideCharacterClass) {
                    rgx = `${rgx.substring(0, i)}\\c${rgx.substring(i + 1)}`;
                    i++;
                }
            }
            if (character === ')') {
                if (insideCharacterClass) {
                    rgx = `${rgx.substring(0, i)}\\d${rgx.substring(i + 1)}`;
                    i++;
                }
            }
            // If the curly brace symbols are used for legitimate RegEx counts then leave them alone. Otherwise, replace them with temporary characters.
            if (character === '{') {
                if (insideCharacterClass) {
                    rgx = `${rgx.substring(0, i)}\\e${rgx.substring(i + 1)}`;
                    i++;
                } else {
                    if (leftBraceIndex !== -1) {
                        rgx = `${rgx.substring(0, leftBraceIndex)}\\e${rgx.substring(leftBraceIndex + 1)}`;
                        i++;
                    }
                    leftBraceIndex = i;
                }
            }
            if (character === '}') {
                if (insideCharacterClass) {
                    rgx = `${rgx.substring(0, i)}\\f${rgx.substring(i + 1)}`;
                    i++;
                } else {
                    if (leftBraceIndex !== -1) {
                        const contentsBetweenBraces: string = rgx.substring(leftBraceIndex + 1, i);
                        if (/^\d+,\d*$/.test(contentsBetweenBraces)) { // e.g. {1,2}
                            throw new Error('RegEx must be of fixed length and so may not contain ranges such as {x,y}.');
                        } else if (!/^\d+$/.test(contentsBetweenBraces)) { // i.e. not {N}
                            rgx = `${rgx.substring(0, leftBraceIndex)}\\e${rgx.substring(leftBraceIndex + 1, i)}\\f${rgx.substring(i + 1)}`;
                            i += 2;
                        }
                    } else {
                        rgx = `${rgx.substring(0, i)}\\f${rgx.substring(i + 1)}`;
                        i++;
                    }
                }
                leftBraceIndex = -1;
            }
            if (character === '|') {
                if (insideCharacterClass) {
                    rgx = `${rgx.substring(0, i)}\\g${rgx.substring(i + 1)}`;
                    i++;
                }
            }
            i++;
        }
        return rgx;
    }


    /**
     * Replaces all RegEx counts (numbers inside curly braces) with copy-pasted repetitons of the relevant blocks instead.
     * @param rgx The RegEx provided.
     * @returns The RegEx, with it's RegEx counts replaced with repetitions.
     */
    static removeRegexCounts(rgx: string): string {
        if (rgx.indexOf('[]') !== -1) {
            throw new Error('RegEx is invalid as it contains the empty character class [].');
        }

        // First we find all curly braces inside of character classes. 
        // We want to keep these around for later, so we replace them with temporary characters. { => \\d and } => \\s.
        let insideBrackets: boolean = false;
        let i: number = 0;

        let braceIndex: number = rgx.indexOf('{');
        // Loop through the RegEx until it no longer has any curly braces.
        while (braceIndex !== -1) {
            // Find the index of the corresponding closing curly brace.
            let lastBraceIndex: number = rgx.indexOf('}', braceIndex + 2);
            // Retrieve the number in between the curly braces. This will be the number of times the previous block will be repeated.
            // Note: We know that this value will be a non-negative integer, as this was checked already in the replaceLiteralBracketCharacters method.
            const num: number = Number(rgx.slice(braceIndex + 1, lastBraceIndex));
    
            // Now we need to work out the block which is to be repeated. This can be either:
            // 1) An expression enclosed within brackets
            // 2) A character class (enclosed within square brackets), or
            // 3) An escaped character (preceded by a backslash), or
            // 4) A single character (note that all special characters have already been removed).

            // Work out which of these three options applies.
            let startSymbol: string | undefined;
            const symbolBefore: string = rgx.charAt(braceIndex - 1);
            if (symbolBefore === ')') {
                startSymbol = '(';
            } else if (symbolBefore === ']') {
                startSymbol = '[';
            } 
            // Loop backwards through rgx until the starting bracket (the start of the repeating block) is found.
            let startIndex: number;
            if (startSymbol) {
                let bracketCount: number = 0;
                startIndex = braceIndex - 2;
                while (rgx.charAt(startIndex) !== startSymbol || bracketCount > 0) {
                    if (rgx.charAt(startIndex) === symbolBefore) {
                        bracketCount++;
                    }
                    if (rgx.charAt(startIndex) === startSymbol) {
                        bracketCount--;
                    }
                    startIndex--;
                }
            }
            // Check if the repeating block is an escaped character.
            else if (braceIndex > 1 && rgx.charAt(braceIndex - 2) === '\\') {
                startIndex = braceIndex - 2;
            }
            // Otherwise, the repeating block is a single character.
            else {
                startIndex = braceIndex - 1;
            }

            const repeatingBlock: string = rgx.slice(startIndex, braceIndex);
            rgx = `${rgx.slice(0, startIndex)}${repeatingBlock.repeat(num)}${rgx.slice(lastBraceIndex + 1, rgx.length)}`;
    
            braceIndex = rgx.indexOf('{');
        }
        return rgx;
    }

    /**
     * Replaces character classes in the RegEx with an OR group. e.g.
     * [a1B_] is replaced with (a|1|B|_).
     * [0-9] is replaced with (0|1|2|3|4|5|6|7|8|9).
     * @param rgx The RegEx provided.
     * @returns The RegEx, with it's character classes replaced with OR groups.
     */
    static removeCharacterClasses(rgx: string): string {
        let braceIndex: number = rgx.indexOf('[');
        // Loop through rgx until there are no more character classes
        while (braceIndex !== -1) {
            const lastBraceIndex: number = rgx.indexOf(']', braceIndex + 2);
            // The contents of the character class.
            let characterOptions: string = rgx.slice(braceIndex + 1, lastBraceIndex);
            characterOptions = this.substituteBracketsForEscapedCharacters(characterOptions);
            let characterList: string[] = [];
            // Do not allow negated character classes.
            if (characterOptions.charAt(0) === '^') {
                throw new Error('RegEx may not contain negated character classes, i.e. character classes which start with a ^ symbol. Any non-word characters must be singly specified.');
            }
            // Any character class which contains only a single character is valid, and we can leave it as it is.
            if (characterOptions.length === 1) {
                braceIndex = rgx.indexOf('[', braceIndex + 2);
                continue;
            }

            // Replace numerical ranges such as 0-9 and 3-8.
            let rangeIndex: number = characterOptions.search(/[0-9]-[0-9]/);
            while (rangeIndex !== -1) {
                characterList = characterList.concat(this.expandRange(characterOptions.substring(rangeIndex, rangeIndex + 3)));
                characterOptions = characterOptions.substring(0, rangeIndex) + characterOptions.substring(rangeIndex + 3);
                rangeIndex = characterOptions.search(/[0-9]-[0-9]/);
            }
            // Replace uppercase letter ranges such as A-Z and J-Q.
            rangeIndex = characterOptions.search(/[A-Z]-[A-Z]/);
            while (rangeIndex !== -1) {
                characterList = characterList.concat(this.expandRange(characterOptions.substring(rangeIndex, rangeIndex + 3)));
                characterOptions = characterOptions.substring(0, rangeIndex) + characterOptions.substring(rangeIndex + 3);
                rangeIndex = characterOptions.search(/[A-Z]-[A-Z]/);
            }
            // Replace lowercase letter ranges such as a-z and b-f.
            rangeIndex = characterOptions.search(/[a-z]-[a-z]/);
            while (rangeIndex !== -1) {
                characterList = characterList.concat(this.expandRange(characterOptions.substring(rangeIndex, rangeIndex + 3)));
                characterOptions = characterOptions.substring(0, rangeIndex) + characterOptions.substring(rangeIndex + 3);
                rangeIndex = characterOptions.search(/[a-z]-[a-z]/);
            }

            // Any other non-word characters in the character class are invalid.
            if (!/^\w*$/.test(characterOptions)) {
                throw new Error('RegEx may not contain character classes that provide special characters as a choice, i.e.' + 
                    'RegEx may not contain a special character between square brackets unless it is the only character between those brackets.');
            }

            // Otherwise, add all the characters in the character class to the character list.
            characterList = characterList.concat(characterOptions.split(''));

            let concatenation: string = `(${characterList.join('|')})`;
            rgx = `${rgx.slice(0, braceIndex)}${concatenation}${rgx.slice(lastBraceIndex + 1, rgx.length)}`;
            braceIndex = rgx.indexOf('[', braceIndex + 2);
        }
        return rgx;
    }

    /**
     * Converts a length-3 character range (as seen inside of a character class) to an array of characters. e.g.
     * 0-9 is converted to ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].
     * @param range The character range, e.g. '1-7' or 'f-y'.
     * @returns An array of characters corresponding to the range provided.
     */
    static expandRange(range: string): string[] {
        // First determine whether the range is a range of digits, uppercase letters or lowercase letters.
        let charArray: string[];
        if (range.charCodeAt(0) < 58) {
            charArray = this.DIGITS;
        } else if (range.charCodeAt(0) < 91) {
            charArray = this.UPPERCASE_LETTERS;
        } else {
            charArray = this.LOWERCASE_LETTERS;
        }
        // Use charArray to replace the range with an array of characters, 
        // e.g. range = 'J-Q' => return array = ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'].
        const startIndex: number = charArray.indexOf(range.charAt(0));
        const endIndex: number = charArray.indexOf(range.charAt(2));
        return charArray.slice(startIndex, endIndex + 1);
    }

    /**
     * RegEx validation and simplification.
     * @param regex The input RegEx.
     * @returns The simplified RegEx.
     */
    static simplifyRegex(regex: string): string {
        let rgx: string = this.basicRegexValidation(regex);
        rgx = this.replaceShorthandCharacters(rgx);
        rgx = this.removeRegexCountsAndCharacterClasses(rgx);
        return rgx;
    }

    /** 
     * Put back [, ], (, ), {, }, and | in place of \a, \b, \c, \d, \e, \f and \g.
     * @param rgx The RegEx provided.
     * @returns The RegEx with the escaped characters replaced by bracket characters.
     */
    static substituteBracketsForEscapedCharacters(rgx: string): string {
        return rgx.replaceAll('\\a', '[').replaceAll('\\b', ']').replaceAll('\\c', '(').replaceAll('\\d', ')').replaceAll('\\e', '{').replaceAll('\\f', '}').replaceAll('\\g', '|');
    }
}