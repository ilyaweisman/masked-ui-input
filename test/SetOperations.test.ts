import { describe, expect, test } from '@jest/globals';
import { SetOperations } from '../src/SetOperations';

describe('Set operations - union', () => {
    test('Union combines values from both sets without duplicates', () => {
        const setA = new Set<number>([1, 2, 3]);
        const setB = new Set<number>([3, 4, 5]);
        expect(SetOperations.union(setA, setB)).toEqual(new Set([1, 2, 3, 4, 5]));
    });
    test('Union returns the other set when one input is undefined', () => {
        const setA = new Set<number>([1, 2]);
        expect(SetOperations.union(setA, undefined)).toEqual(new Set([1, 2]));
        expect(SetOperations.union(new Set([]), setA)).toEqual(new Set([1, 2]));
    });
    test('Union returns an empty set when both inputs are undefined', () => {
        expect(SetOperations.union(undefined, undefined)).toEqual(new Set());
    });
});

describe('Set operations - intersection', () => {
    test('Intersection returns the common values', () => {
        const setA = new Set<number>([1, 2, 3, 4]);
        const setB = new Set<number>([3, 4, 5, 6]);
        expect(SetOperations.intersection(setA, setB)).toEqual(new Set([3, 4]));
    });
    test('Intersection returns an empty set when either input is empty or undefined', () => {
        const setA = new Set<number>([1, 2]);
        expect(SetOperations.intersection(setA, undefined)).toEqual(new Set());
        expect(SetOperations.intersection(new Set([]), setA)).toEqual(new Set());
    });
});

describe('Set operations - equality', () => {
    test('Equal returns true when both sets contain the same values', () => {
        const setA = new Set<number>([1, 2, 3]);
        const setB = new Set<number>([3, 2, 1]);
        expect(SetOperations.equal(setA, setB)).toBe(true);
    });
    test('Equal returns false when the sets differ', () => {
        const setA = new Set<number>([1, 2, 3]);
        const setB = new Set<number>([1, 2, 4]);
        expect(SetOperations.equal(setA, setB)).toBe(false);
    });
    test('Equal handles empty and undefined values correctly', () => {
        expect(SetOperations.equal(undefined, undefined)).toBe(true);
        expect(SetOperations.equal(undefined, new Set([1, 2]))).toBe(false);
        expect(SetOperations.equal(new Set([1, 2]), undefined)).toBe(false);
        expect(SetOperations.equal(new Set([]), undefined)).toBe(true);
        expect(SetOperations.equal(new Set([]), new Set([]))).toBe(true);
    });
});
