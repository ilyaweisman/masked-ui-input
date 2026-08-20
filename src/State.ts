/**
 * A class representing a state in a finite automaton, with an ID and a set of numbers.
 */
export class State {
    private id: number = 0;
    private stateSet: Set<number> = new Set();
    
    constructor(id: number, stateSet: Set<number>) {
        this.id = id;
        this.stateSet = stateSet;
    }

    /**
     * Getters and setters.
     */


    getId(): number {
        return this.id;
    }

    setId(id: number): void {
        this.id = id;
    }

    getStateSet(): Set<number> {
        return this.stateSet;
    }

    setStateSet(stateSet: Set<number>): void {
        this.stateSet = stateSet;
    }
}