import { DFA } from "./DFA";

export class RegexToDFA {
    regex: string = '';

    constructor(regex: string) {
        this.regex = regex;
    }

    /**
     * Checks if the RegEx is valid. Removes start and end anchors from the RegEx.
     */
    basicRegexValidation() {
        try {
            new RegExp(this.regex);
        } catch (e) {
            throw new Error('RegEx "' + this.regex + '" is invalid.');
        }
        if (this.regex.startsWith('^')) {
            this.regex = this.regex.substring(1, this.regex.length);
        }  
        if (this.regex.endsWith('$') && this.regex.charAt(this.regex.length - 2) !== '\\') {
            this.regex = this.regex.substring(0, this.regex.length - 1);
        }
    }

    /**
     * Replaces all shorthand character classes in the RegEx, as well as the . character, with corresponding expanded character classes.
     * Throws an error if the RegEx contains *, + or ?, as that would make it not fixed-length.
     */
    replaceShorthandCharacters() {
        let rgx: string = this.regex;
        // The only characters inside of character classes (with the exception of single characters) should be word characters,
        // namely A-Z, a-z, 0-9 and _. Proceeding on this statement, we replace shorthand character classes in the following way:
        rgx = rgx.replaceAll('\\d', '[0-9]')
            .replaceAll('\\s', '[ ]')
            .replaceAll('\\D', '[A-Za-z_]')
            .replaceAll('\\w', '[A-Za-z0-9_]')
            .replaceAll('\\S', '[A-Za-z0-9_]');

        if (rgx.indexOf('\\') !== -1) {
            throw new Error('RegEx must not contain any escaped characters, except for the following shorthand character classes: \\\\d, \\\\D, \\\\s, \\\\S and \\\\w.');
        }

        let ind: number = 0;
        let insideBrackets: boolean = false;
        // Replace all full stops (.) outside of character classes with [A-Za-z0-9_].
        while (ind < rgx.length) {
            const char = rgx.charAt(ind);
            if (char === '[') {
                insideBrackets = true;
            }
            if (char === ']') {
                insideBrackets = false;
            }
            if (char === '.' && !insideBrackets) {
                rgx = `${rgx.substring(0, ind)}[0-9A-Za-z_]${rgx.substring(ind + 1)}`;
                ind += 9;
                continue;
            }
            // RegEx may not contain *, + or ? outside of a character class.
            if ((char === '*' || char === '+' || char === '?') && !insideBrackets) {
                throw new Error(`RegEx must be of fixed length, and so cannot contain quantifiers like *, + or ?. If you wanted to match 
                    these characters instead of using them as quantifiers, place them in character classes: [*], [+], or [?].`);
            }
            ind++;
        }
        this.regex = rgx;
    }


    /** 
     * In the RegEx, replace any bracket characters which are meant to be interpreted as literals with temporary characters.
     */
    public replaceLiteralBracketCharacters(regex: string): string {
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
            // If the curly brace symbols are used for legitimate RegEx counts thn leave them alone. Otherwise, replace them with temporary characters.
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
                            throw new Error('RegEx must be of fixed length and so may not contain ranges such as {x, y}.');
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
            i++;
        }
        return rgx;
    }


    /**
	 * Replaces all RegEx counts (numbers inside curly braces) with copy-pasted repetitons of the relevant blocks instead.
	 */
	public removeRegexCounts() {
        let rgx: string = this.replaceLiteralBracketCharacters(this.regex);

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
			const symbolBefore = rgx.charAt(braceIndex - 1);
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
		// Replace the temporary characters with the curly braces again.
		rgx = rgx.replaceAll('\\a', '[').replaceAll('\\b', ']').replaceAll('\\c', '(').replaceAll('\\d', ')').replaceAll('\\e', '{').replaceAll('\\f', '}');

		this.regex = rgx;
	}



    
    convertRegexToDFA(regex: string): DFA {
        this.regex = regex;
        return new DFA('');
    }
}