export class SyntaxTreeNode{
    
    private value: string = '';
    private type: NodeType = NodeType.LEAF;
    private left: SyntaxTreeNode | null = null;
    private right: SyntaxTreeNode | null = null;    
    private nullable: boolean = false;
    private firstpos: Set<number> = new Set();
    private lastpos: Set<number> = new Set();
    private finalLeafNode: boolean = false;

    constructor(value: string, type: NodeType) {
        this.value = value;
        this.type = type;
    }

    getValue(): string {
        return this.value;
    }

    setValue(value: string): void {
        this.value = value;
    }

    getType(): NodeType {
        return this.type;
    }

    setType(type: NodeType): void {
        this.type = type;
    }

    getLeft(): SyntaxTreeNode | null {
        return this.left;
    }

    setLeft(left: SyntaxTreeNode | null): void {
        this.left = left;
    }

    getRight(): SyntaxTreeNode | null {
        return this.right;
    }

    setRight(right: SyntaxTreeNode | null): void {
        this.right = right;
    }

    getNullable(): boolean {
        return this.nullable;
    }

    setNullable(nullable: boolean): void {
        this.nullable = nullable;
    }

    getFirstpos(): Set<number> {
        return this.firstpos;
    }

    setFirstpos(firstpos: Set<number>): void {
        this.firstpos = firstpos;
    }

    getLastpos(): Set<number> {
        return this.lastpos;
    }

    setLastpos(lastpos: Set<number>): void {
        this.lastpos = lastpos;
    }

    isFinalLeafNode(): boolean {
        return this.finalLeafNode;
    }

    setFinalLeafNode(finalLeafNode: boolean): void {
        this.finalLeafNode = finalLeafNode;
    }

    /**
     * Verifies whether all OR nodes in the subtree rooted at this node are balanced, 
     * meaning that all children of an OR node have equivalent numbers of leaf nodes.
     */
    verifyOrNodesAreBalanced(): boolean {
        const balance: number = this.calculateOrNodesBalance(this);
        return balance !== Infinity;
    }

    /**
     * Calculates the balance of OR nodes in the subtree rooted at the given node.
     * @param node The root node of the subtree to evaluate.
     * @returns The balance of OR nodes, or Infinity if they are unbalanced.
     */
    private calculateOrNodesBalance(node: SyntaxTreeNode): number {
        if (node.getType() === NodeType.NULL) {
            return 0;
        }
        if (node.getType() === NodeType.LEAF) {
            return 1;
        }
        else if (node.getType() !== NodeType.OR) {
            return this.calculateOrNodesBalance(node.getLeft()!) + this.calculateOrNodesBalance(node.getRight()!);
        }
        else { // OR node
            const children: Array<SyntaxTreeNode> = [node.getRight()!];
            let leftChild: SyntaxTreeNode = node.getLeft()!;
            while (leftChild.getType() === NodeType.OR) {
                children.push(leftChild.getRight()!);
                leftChild = leftChild.getLeft()!;
            }
            children.push(leftChild);
            const balance: number = this.calculateOrNodesBalance(children[0]);
            for (const child of children.slice(1)) {
                const childBalance: number = this.calculateOrNodesBalance(child);
                if (childBalance !== balance) {
                    return Infinity; // Indicates an unbalanced OR node
                }
            }
            return balance;
        }
    }


    /**
     * Prints the SyntaxTreeNode and its subtree using depth-first traversal.
     */
    printSyntaxTree(printNodeProperties: boolean = false): void {
        console.log(this.printSyntaxTreeHelper(0, printNodeProperties));
    }

    /**
     * Helper method for depth-first traversal print with indentation.
     * @param depth The current depth in the tree for indentation.
     */
    private printSyntaxTreeHelper(depth: number, printNodeProperties: boolean): string {
        const indent: string = '  '.repeat(depth);
        let rtn: string = `${indent}Node: type=${NodeType[this.type]}, value='${this.value}'` + (printNodeProperties ? 
            `, nullable=${this.nullable}, firstpos=[${Array.from(this.firstpos).join(', ')}], lastpos=[${Array.from(this.lastpos).join(', ')}]` : ``);
        
        if (this.left !== null) {
            rtn += `\n${indent}├─ LEFT:`;
            rtn += '\n' + this.left.printSyntaxTreeHelper(depth + 1, printNodeProperties);
        }

        if (this.right !== null) {
            rtn += `\n${indent}├─ RIGHT:`;
            rtn += '\n' + this.right.printSyntaxTreeHelper(depth + 1, printNodeProperties);
        }
        return rtn;
    }
}

export enum NodeType {
    LEAF,
    OR,
    CAT,
    STAR,
    NULL
}