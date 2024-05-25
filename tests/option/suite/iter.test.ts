import { expect } from "chai";
import { Option, Result } from "../../../src";

export default function iter() {
  it("Should create an iterator from Some", () => {
    const iter = Option.some([1, 2])[Symbol.iterator]();
    expect(iter.next()).to.eql({ value: 1, done: false });
    expect(iter.next()).to.eql({ value: 2, done: false });
    expect(iter.next()).to.eql({ value: undefined, done: true });
  });

  it("Should create an empty iterator from None", () => {
    const iter = (Option.none as Option<number[]>)[Symbol.iterator]();
    expect(iter.next()).to.eql({ value: undefined, done: true });
  });

  it("Should create an iterator from nested monads", () => {
    const iter = Option.some(Result.ok(Option.some([1, 2])))[Symbol.iterator]();
    expect(iter.next()).to.eql({ value: 1, done: false });
    expect(iter.next()).to.eql({ value: 2, done: false });
    expect(iter.next()).to.eql({ value: undefined, done: true });

    const noneIter = Option.some(Result.ok(Option.none as Option<number[]>))[
      Symbol.iterator
    ]();
    expect(noneIter.next()).to.eql({ value: undefined, done: true });
  });

  it("Should throw if the contained value is not iterable", () =>
    expect(() => Option.some(1)[Symbol.iterator]()).to.throw(/not a function/));
}
