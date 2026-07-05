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
        const indent = '  '.repeat(depth);
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