import { DFA } from "./DFA";
import { RegexSimplifier } from "./RegexSimplifier";
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

    constructor() {
        this.regex = '';
        this.nodeIndex = 1
        this.regexCharacters = new Map();
        this.followpos = new Map();
        this.DFA = new DFA();
    }

    /**
     * Getters and setters.
     */

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
	 * Converts a RegEx rgx into a syntax binary tree.
	 * @param rgx The RegEx provided.
	 * @returns The root node of the syntax tree.
	 */
	regexToSyntaxTree(rgx: string): SyntaxTreeNode {
		if (!rgx.length) {
			return new SyntaxTreeNode('', NodeType.NULL);
		}
		const lastCharacterIndex: number = rgx.length - 1;
		// If the RegEx consists of one character, or one escaped character, return a leaf node with value equal to that character.
		if (lastCharacterIndex === 0 || (lastCharacterIndex === 1 && rgx.charAt(0) == '\\')) { 
			return new SyntaxTreeNode(RegexSimplifier.substituteBracketsForEscapedCharacters(rgx).replaceAll('\\\\', '\\'), NodeType.LEAF);
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
                const contents: string = RegexSimplifier.substituteBracketsForEscapedCharacters(rgx.substring(startIndex + 1, lastCharacterIndex)).replaceAll('\\\\', '\\');
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
                    rightNode = new SyntaxTreeNode(RegexSimplifier.substituteBracketsForEscapedCharacters(rgx.substring(lastCharacterIndex - 1, lastCharacterIndex + 1)).replaceAll('\\\\', '\\'), NodeType.LEAF);
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
	 * Set the nullable, firstpos and lastpos properties of each node in the syntax tree 
	 * using a post-order traversal recursive methodology.
	 * @param node The syntax tree node.
	 */
	setNodeProperties(node: SyntaxTreeNode): void {
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
	calculateFollowpos(node: SyntaxTreeNode) {
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
	populateStatesAndTransitions(root: SyntaxTreeNode) {
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
        // RegEx validation and simplification.
        this.regex = RegexSimplifier.simplifyRegex(regex);

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
        this.DFA.findTrapState();

        if (this.DFA.choiceInSpecialCharacters()) {
            throw new Error(`The RegEx contains a choice in which special character to input at a given position, which is not permitted. The user should be inputting alphanumeric characters only.`);
        }

        return this.DFA;
    }
}