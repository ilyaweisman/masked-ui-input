export class SyntaxTreeNode{
    
    private value: string = '';
    private type: NodeType = NodeType.LEAF;
    private left: SyntaxTreeNode | null = null;
    private right: SyntaxTreeNode | null = null;    
    private followpos: Set<number> = new Set();



    constructor(value: string, type: NodeType) {
        this.type = type;
    }
}

enum NodeType {
    LEAF,
    OR,
    CAT,
    STAR,
    NULL
}