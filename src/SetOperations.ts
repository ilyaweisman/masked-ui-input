export class SetOperations {
    /**
     * Set union.
     */
    public static union(setA: Set<number> | undefined, setB: Set<number> | undefined): Set<number> {
        if (!setA && !setB) return new Set<number>();
        if (!setA) return setB!;
        if (!setB) return setA!;
        return new Set([...setA, ...setB]);
    }

    /**
     * Set intersection.
     */
    public static intersection(setA: Set<number> | undefined, setB: Set<number> | undefined): Set<number> {
        if (!setA || !setB) return new Set<number>();
        return new Set([...setA].filter((x) => setB.has(x)));
    }

    /**
     * Set equality.
     */
    public static equal(setA: Set<number> | undefined, setB: Set<number> | undefined): boolean {
        if (!setA && !setB) return true;
        if (!setA) return !(setB!.size);
        if (!setB) return !setA.size;
        return setA.size === setB.size && [...setA].every(value => setB.has(value));
    }
}
