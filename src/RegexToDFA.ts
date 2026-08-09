import { DFA } from "./DFA";
import { SetOperations } from "./SetOperations";
import { State } from "./State";
import { NodeType, SyntaxTreeNode } from "./SyntaxTreeNode";

/**
 * Class which converts a fixed-length RegEx into a DFA.
 */
export class RegexToDFAConverter {
    private regex: string;
    private nodeIndex: number;
    private regexCharacters: Map<string, Set<number>>;
    private followpos: Map<number, Set<number>>;
    private DFA: DFA;

    // Define arrays of uppercase letters, lowercase letters and digits.
    alpha: number[] = Array.from(Array(26).keys()).map((i) => i + 65);
    uppercaseLetters: string[] = this.alpha.map((x) => String.fromCharCode(x));
    lowercaseLetters: string[] = this.alpha.map((x) => String.fromCharCode(x + 32));
    digits: string[] = Array.from(Array(10).keys()).map((x) => x.toString());

    constructor() {
        this.regex = '';
        this.nodeIndex = 1
        this.regexCharacters = new Map();
        this.followpos = new Map();
        this.DFA = new DFA();
    }

    getRegex(): string {
        return this.regex;
    }

    setRegex(regex: string): void {
        this.regex = regex;
    }

    getNodeIndex(): number {
        return this.nodeIndex;
    }

    setNodeIndex(nodeIndex: number): void {
        this.nodeIndex = nodeIndex;
    }

    getRegexCharacters(): Map<string, Set<number>> {
        return this.regexCharacters;
    }

    setRegexCharacters(regexCharacters: Map<string, Set<number>>): void {
        this.regexCharacters = regexCharacters;
    }

    getFollowpos(): Map<number, Set<number>> {
        return this.followpos;
    }

    setFollowpos(followpos: Map<number, Set<number>>): void {
        this.followpos = followpos;
    }

    getDFA(): DFA {
        return this.DFA;
    }

    setDFA(dfa: DFA): void {
        this.DFA = dfa;
    }

    /**
     * Checks if the RegEx is valid. Removes start and end anchors from the RegEx.
     */
    basicRegexValidation(): void {
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
     * Replaces all shorthand character classes in the RegEx with corresponding expanded character classes.
     * Throws an error if the RegEx contains *, + or ?, as that would make it not fixed-length.
     * Throws an error if the RegEx contains ., as only word characters are permitted unless singly specified inside a character class.
     */
    replaceShorthandCharacters(): void {
        let rgx: string = this.regex;

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
        this.regex = rgx;
    }

    
    /**
     * Replaces all the regex counts and character classes in the RegEx with their expanded forms.
     * @returns the regex (still contains temporary escaped characters)
     */
    public removeRegexCountsAndCharacterClasses(): string {
        let rgx: string = this.replaceLiteralBracketCharacters(this.regex);
        rgx = this.removeRegexCounts(rgx);
        rgx = this.removeCharacterClasses(rgx); // TODO: Use this value of RegEx to convert to a syntax tree.
        // Replace the temporary characters with the curly braces again.
		this.regex = this.substituteBracketsForEscapedCharacters(rgx);
        return rgx;
    }


    /** 
     * In the RegEx, replace any bracket characters which are meant to be interpreted as literals with temporary characters.
     * [, ], (, ), {, }, | replaced with \a, \b, \c, \d, \e, \f and \g.
     * @param rgx The RegEx provided.
	 * @returns The RegEx, with it's literal bracket characters replaced escaped characters.
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
	public removeRegexCounts(rgx: string): string {
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
	public removeCharacterClasses(rgx: string): string {
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
	public expandRange(range: string): string[] {
		// First determine whether the range is a range of digits, uppercase letters or lowercase letters.
		let charArray: string[];
        if (range.charCodeAt(0) < 58) {
            charArray = this.digits;
        } else if (range.charCodeAt(0) < 91) {
            charArray = this.uppercaseLetters;
        } else {
            charArray = this.lowercaseLetters;
        }
        // Use charArray to replace the range with an array of characters, 
        // e.g. range = 'J-Q' => return array = ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'].
        const startIndex: number = charArray.indexOf(range.charAt(0));
        const endIndex: number = charArray.indexOf(range.charAt(2));
        return charArray.slice(startIndex, endIndex + 1);
	}


    /**
	 * Converts a RegEx rgx into a syntax binary tree.
	 * @param rgx The RegEx provided.
	 * @returns The root node of the syntax tree.
	 */
	public regexToSyntaxTree(rgx: string): SyntaxTreeNode {
		if (!rgx.length) {
			return new SyntaxTreeNode('', NodeType.NULL);
		}
		const lastCharacterIndex: number = rgx.length - 1;
		// If the RegEx consists of one character, or one escaped character, return a leaf node with value equal to that character.
		if (lastCharacterIndex === 0 || (lastCharacterIndex === 1 && rgx.charAt(0) == '\\')) { 
			return new SyntaxTreeNode(this.substituteBracketsForEscapedCharacters(rgx).replaceAll('\\\\', '\\'), NodeType.LEAF);
		}

        const root: SyntaxTreeNode = new SyntaxTreeNode('', NodeType.LEAF);
		let rightNode: SyntaxTreeNode;
		let startIndex: number = lastCharacterIndex;
		// If the last character of the RegEx is a *, set the right node to be null.
		// The left node is recusrsively calculated.
        const lastCharacter: string = rgx.charAt(lastCharacterIndex);
		if (lastCharacter === '*') {
			root.setType(NodeType.STAR);
			root.setLeft(this.regexToSyntaxTree(rgx.substring(0, lastCharacterIndex)));
			const nullNode: SyntaxTreeNode = new SyntaxTreeNode('', NodeType.NULL);
			root.setRight(nullNode);
			return root;
		}

        // Check if there are any | characters in the RegEx outside of brackets.
        let pipeIndex: number = lastCharacterIndex;
        let bracketCount: number = 0;
        while (pipeIndex >= 0) {
            if (rgx.charAt(pipeIndex) === ')') {
                bracketCount++;
            }
            if (rgx.charAt(pipeIndex) === '(') {
                bracketCount--;
            }
            if (rgx.charAt(pipeIndex) === '|' && bracketCount === 0) {
                break;
            }
            pipeIndex--;
        }
        // If there are, the right node becomes the characters following this pipe.
        if (pipeIndex !== -1) {
            startIndex = pipeIndex + 1;
            rightNode = this.regexToSyntaxTree(rgx.substring(startIndex));
        }
        else {
            // If the last character of the RegEx is a ], there should only be a single character in between the square brackets, or else a single escape character, 
            // as all longer character classes have been expanded. Set the right node to be a leaf node with value that single character.
            if (lastCharacter === ']') { 
                startIndex = lastCharacterIndex - 2;
                if (rgx.charAt(startIndex) === '\\') {
                    startIndex--;
                }
                const contents: string = this.substituteBracketsForEscapedCharacters(rgx.substring(startIndex + 1, lastCharacterIndex)).replaceAll('\\\\', '\\');
                // If the whole RegEx is enclosed in square brackets then set the root node to be the character inside the square brackets.
                if (startIndex === 0) {
                    root.setType(NodeType.LEAF);
                    root.setValue(contents);
                    return root;
                }
                // Otherwise, the right node is set to be the character inside the square brackets.
                rightNode = new SyntaxTreeNode(contents, NodeType.LEAF);
            }
            // Otherwise, the last character must be a ')', in which case find the substring enclosed by the brackets.
            // The right node is recursively calculated from this substring.
            else if (lastCharacter === ')') {
                bracketCount = 1;
                startIndex --;
                while (startIndex >= 0 && bracketCount > 0) {
                    if (rgx.charAt(startIndex) === ')') {
                        bracketCount++;
                    }
                    if (rgx.charAt(startIndex) === '(') {
                        bracketCount--;
                    }
                    startIndex--;
                }
                startIndex++;
                // If the whole RegEx is enclosed in brackets then return the recursively calculated node
                // for the contents inside these brackets.
                if (startIndex === 0) {
                    return this.regexToSyntaxTree(rgx.substring(startIndex + 1, lastCharacterIndex));
                } 
                // Otherwise, the right node is recursively calculated from the contents inside the brackets.
                rightNode = this.regexToSyntaxTree(rgx.substring(startIndex + 1, lastCharacterIndex));
                
            }
            // Otherwise, as long as the last characater is not a ')' it means that the last character is a standard character, or else part of an escaped character.
            // Set the right node to be a leaf node with value that standard/escaped character.
            else {
                if (lastCharacterIndex !== 0 && rgx.charAt(lastCharacterIndex - 1) === '\\') {
                    rightNode = new SyntaxTreeNode(this.substituteBracketsForEscapedCharacters(rgx.substring(lastCharacterIndex - 1, lastCharacterIndex + 1)).replaceAll('\\\\', '\\'), NodeType.LEAF);
                } else {
                    rightNode = new SyntaxTreeNode(lastCharacter, NodeType.LEAF);
                }
            }
        }
		root.setRight(rightNode);
		// If the second-last character is a '|', then we have an OR node, and the left node is recursively
		// calculated using the third-last character backwards.
		if (rgx.charAt(startIndex - 1) === '|') {
			root.setType(NodeType.OR);
			root.setLeft(this.regexToSyntaxTree(rgx.substring(0, startIndex - 1)));
		}
		// Otherwise, we have a CAT (concatnation) node, and the left node is recursively
		// calculated using the second-last character backwards.
		else {
			root.setType(NodeType.CAT);
			root.setLeft(this.regexToSyntaxTree(rgx.substring(0, startIndex)));
		}
		return root;
	} 

    /** 
     * Put back [, ], (, ), {, }, and | in place of \a, \b, \c, \d, \e, \f and \g.
     * @param rgx The RegEx provided.
     * @returns The RegEx with the escaped characters replaced by bracket characters.
     */
    public substituteBracketsForEscapedCharacters(rgx: string): string {
        return rgx.replaceAll('\\a', '[').replaceAll('\\b', ']').replaceAll('\\c', '(').replaceAll('\\d', ')').replaceAll('\\e', '{').replaceAll('\\f', '}').replaceAll('\\g', '|');
        
    }

    /**
	 * Set the nullable, firstpos and lastpos properties of each node in the syntax tree 
	 * using a post-order traversal recursive methodology.
	 * @param node The syntax tree node.
	 */
	public setNodeProperties(node: SyntaxTreeNode): void {
		// Post-order traversal.
        const left: SyntaxTreeNode | null = node.getLeft();
        if (left !== null) {
            this.setNodeProperties(left);
        }

        const right: SyntaxTreeNode | null = node.getRight();
        if (right !== null) {
            this.setNodeProperties(right);
        }

		// Set the nullable, firstpos and lastpos node properties depending on the node type.
		if (node.getType() === NodeType.NULL) {
			node.setNullable(true);
			node.setFirstpos(new Set<number>());
			node.setLastpos(new Set<number>());
		} else if (node.getType() === NodeType.LEAF) {
			node.setNullable(false);
			node.setFirstpos((new Set<number>()).add(this.nodeIndex));
			node.setLastpos((new Set<number>()).add(this.nodeIndex));
			// For leaf nodes, add the node value and node indexes which have this value to regexCharacters for future use.
			if (!node.isFinalLeafNode()) {
                if (!this.regexCharacters.get(node.getValue())) {
                    this.regexCharacters.set(node.getValue(), new Set<number>());
                }
                // get(...) is guaranteed to exist above, use non-null assertion and add directly
                this.regexCharacters.get(node.getValue())!.add(this.nodeIndex);
			}
            node.setFinalLeafNode(false);
			// Increment nodeIndex so that the next leaf node will have a different index.
			this.nodeIndex++;
		} else if (node.getType() === NodeType.OR) {
			node.setNullable(node.getLeft()!.getNullable() || node.getRight()!.getNullable());
			node.setFirstpos(SetOperations.union(node.getLeft()!.getFirstpos(), node.getRight()!.getFirstpos()));
			node.setLastpos(SetOperations.union(node.getLeft()!.getLastpos(), node.getRight()!.getLastpos()));
		} else if (node.getType() === NodeType.CAT) {
			node.setNullable(node.getLeft()!.getNullable() && node.getRight()!.getNullable());
			if (node.getLeft()!.getNullable()) {
				node.setFirstpos(SetOperations.union(node.getLeft()!.getFirstpos(), node.getRight()!.getFirstpos()));
			} else {
				node.setFirstpos(node.getLeft()!.getFirstpos());
			}
			if (node.getRight()!.getNullable()) {
				node.setLastpos(SetOperations.union(node.getLeft()!.getLastpos(), node.getRight()!.getLastpos()));
			} else {
				node.setLastpos(node.getRight()!.getLastpos());
			}
		} else { // node.type === NodeType.STAR
			node.setNullable(true);
			node.setFirstpos(node.getLeft()!.getFirstpos());
			node.setLastpos(node.getLeft()!.getLastpos());
		}
	}


    /**
	 * Calculates the followpos values for each leaf node using a post-order traversal recursive methodology.
	 * @param node The syntax tree node.
	 */
	public calculateFollowpos(node: SyntaxTreeNode) {
		// Post-order traversal.
        const left: SyntaxTreeNode | null = node.getLeft();
        if (left !== null) {
            this.calculateFollowpos(left);
        }
        const right: SyntaxTreeNode | null = node.getRight();
        if (right !== null) {
            this.calculateFollowpos(right);
        }

		// Add entries to followpos values based on whether the node is a CAT node or a STAR node.
		if (node.getType() === NodeType.CAT) {
			node.getLeft()?.getLastpos().forEach(i => {
				this.followpos.set(i, SetOperations.union(this.followpos.get(i), node.getRight()?.getFirstpos()))
            });
		} else if (node.getType() === NodeType.STAR) {
			node.getLastpos().forEach(i => {
				this.followpos.set(i, SetOperations.union(this.followpos.get(i), node.getFirstpos()))
			});
		}
	}


    /**
	 * Populates the list of states dStates and the transition table dTrans for the DFA.
	 * @param root The root node of the syntax tree.
	 */
	public populateStatesAndTransitions(root: SyntaxTreeNode) {
		let stateNumber: number = 0;
		let oldStateNumber: number = -1;
		this.DFA.getStates()[stateNumber] = new State(stateNumber, root.getFirstpos());
		// Until no new states have been added to the state list:
		while (oldStateNumber !== stateNumber) {
			oldStateNumber++;
			this.regexCharacters.forEach((nodeIndices, nodeCharacter) => {
				// Calculate the new state value.
				const intersection: Set<number> = SetOperations.intersection(nodeIndices, this.DFA.getStates()[oldStateNumber].getStateSet());
				let union: Set<number> = new Set();
				intersection.forEach(number => {
					union = SetOperations.union(union, this.followpos.get(number));
				});
				let addedToTrans: boolean = false;
				// Loop through the existing states.
				for (const state of Object.values(this.DFA.getStates())) {
					// If the value of one of these state equals to the new state value then add an entry to the transition table and break.
					if (SetOperations.equal(union, state.getStateSet())) {
                        const transitionKey: string = `${oldStateNumber}${nodeCharacter}`;
						this.DFA.getTransitions().set(transitionKey, state);
						addedToTrans = true;
						break;
					}
				}
				// If the new state value does not match any of the existing state value, add a new state to the state list and 
				// add an entry to the transition table.
				if (!addedToTrans) {
					stateNumber++;
					this.DFA.getStates()[stateNumber] = new State(stateNumber, union);
                    const transitionKey: string = `${oldStateNumber}${nodeCharacter}`;
					this.DFA.getTransitions().set(transitionKey, this.DFA.getStates()[stateNumber]);
				}
			});
		}
	}

    /**
     * Convert a fixed-length RegEx into a Discrete Finite Automaton (DFA) using the following algorithm:
     * https://www.geeksforgeeks.org/compiler-design/regular-expression-to-dfa/
     * @param regex The input RegEx.
     * @returns A Discrete Finite Automaton which is equivalent to the provided RegEx.
     */
    convertRegexToDFA(regex: string): DFA {
        this.regex = regex;
        // REgex validation and simplification.
        this.basicRegexValidation();
        this.replaceShorthandCharacters();
        this.regex = this.removeRegexCountsAndCharacterClasses();

        // Building the syntax tree (intermediate step).
        const syntaxTree: SyntaxTreeNode = this.regexToSyntaxTree(`(${this.regex})#`);
        if (!syntaxTree.verifyOrNodesAreBalanced()) {
            throw new Error(`RegEx contains an unbalanced OR (|) operator, which means that strings 
                accepted by the RegEx can have varying lengths. The RegEx must be of fixed length.`);
        }
        syntaxTree.getRight()?.setFinalLeafNode(true);
        this.setNodeProperties(syntaxTree);
        this.calculateFollowpos(syntaxTree);
        
        // Build the DFA.
        this.populateStatesAndTransitions(syntaxTree);
        this.DFA.generateSetOfTrapStates();

        return this.DFA;
    }
}