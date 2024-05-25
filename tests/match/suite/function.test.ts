import { expect } from "chai";
import { Option, match, Fn } from "../../../src";

export default function fn() {
  const first = createWatchFn("first");
  const second = createWatchFn("second");

  function test(input: Option<() => string>): string {
    return match(input, [
      [Option.some(Fn(first)), "match-first"],
      [Option.some(Fn(second)), "match-second"],
      () => "default",
    ]);
  }

  it("Matches", () => {
    expect(test(Option.some(first))).to.equal("match-first");
    expect(first.wasCalled()).to.be.false;
    expect(test(Option.some(() => "none"))).to.equal("default");
  });

  it("Does not call functions within Monads", () => {
    expect(test(Option.some(second))).to.equal("match-second");
    expect(second.wasCalled()).to.be.false;
  });

  it("Does not call functions nested within monads", () => {
    const nested = createWatchFn("nested");
    expect(
      match(Option.some({ a: [1] }), [
        [Option.some({ a: [nested as any] }), "fail"],
        () => "default",
      ])
    ).to.equal("default");
    expect(nested.wasCalled()).to.be.false;
  });

  it("Returns the wrapped function if the default branch is Fn", () =>
    expect(
      match(first, [
        Fn(() => "default"), // default branch
      ])()
    ).to.equal("default"));

  it("Throws if the wrapped Fn is called", () =>
    expect(Fn(() => 1)).to.throw(/wrapped function called/));
}

function createWatchFn(returns: string): { (): string; wasCalled(): boolean } {
  let called = false;
  const fn = () => {
    called = true;
    return returns;
  };

  fn.wasCalled = () => called;
  return fn;
}
