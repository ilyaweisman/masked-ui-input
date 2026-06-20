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
        let rgx = this.regex;
        // The only characters inside of character classes (with the exception of single characters) should be word characters,
        // namely A-Z, a-z, 0-9 and _. Proceeding on this statement, we replace shorthand character classes in the following way:
        rgx = rgx.replaceAll('\\d', '[0-9]')
            .replaceAll('\\s', '[ ]')
            .replaceAll('\\D', '[A-Za-z_]')
            .replaceAll('\\w', '[A-Za-z0-9_]')
            .replaceAll('\\S', '[A-Za-z0-9_]');

        if (rgx.indexOf('\\') !== -1) {
            throw new Error('RegEx must not contain any shorthand character classes except \\\\d, \\\\D, \\\\s, \\\\S and \\\\w.');
        }

        let ind = 0;
        let insideBrackets = false;
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
                rgx = `${rgx.substring(0, ind)}[0-9A-Za-z_]${rgx.substring(ind + 1, rgx.length)}`;
                ind += 9;
                continue;
            }
            // RegEx may not contain *, + or ? outside of a character class.
            if ((char === '*' || char === '+' || char === '?') && !insideBrackets) {
                throw new Error(`RegEx must be of fixed length, and so cannot contain quantifiers like *, + or ?. If you wanted to match 
                    these characters instead of using them as quantifiers, escape them using a backslash: \\*, \\+, or \\?. Alternatively, place them in character classes: [*], [+], or [?].`);
            }
            ind++;
        }
        this.regex = rgx;
    }



    
    convertRegexToDFA(regex: string): DFA {
        this.regex = regex;
        return new DFA('');
    }
}