import { expect } from "chai";
import { Option, match, _ } from "../../../src";

export default function option() {
  describe("Mapped", mapped);
  describe("Chained", chained);
  describe("Combined (chained within mapped)", combined);
}

function mapped() {
  function test(val: Option<number>): string {
    return match(val, {
      Some: (n) => `some ${n}`,
      None: () => "none",
    });
  }

  it("Executes the mapped Some branch", () =>
    expect(test(Option.some(1))).to.equal("some 1"));
  it("Executes the mapped None branch", () =>
    expect(test(Option.none)).to.equal("none"));
  it("Throws when there is no match", () =>
    expect(() =>
      match(Option.some(1), {
        None: () => true, //
      })
    ).to.throw(/exhausted/));
}

function chained() {
  chainedTest();
  chainedArrayTest();
  chainedObjectTest();
  chainedConditionsTest();
}

function chainedTest() {
  function test(val: Option<number>): string {
    return match(val, [
      [Option.some(1), "some 1"],
      [Option.some(_), "some default"],
      [Option.none, "none"],
    ]);
  }

  it("Matches the chained branches", () => {
    expect(test(Option.some(1))).to.equal("some 1");
    expect(test(Option.some(2))).to.equal("some default");
  });
}

function chainedArrayTest() {
  function test(input: Option<number[]>): string {
    return match(input, [
      [Option.some([1, 2]), "1 2"],
      [Option.some([2, _, 6]), "2 _ 6"],
      () => "default",
    ]);
  }

  it("Deeply matches arrays within chains", () => {
    expect(test(Option.some([1, 2, 3]))).to.equal("1 2");
    expect(test(Option.some([2, 4, 6]))).to.equal("2 _ 6");
    expect(test(Option.some([2, 3, 4]))).to.equal("default");
  });
}

function chainedObjectTest() {
  function test(input: Option<{ a: number; c?: { d: number } }>): string {
    return match(input, [
      [Option.some({ a: 1 }), "a 1"],
      [Option.some({ c: { d: 10 } }), "cd 10"],
      () => "default",
    ]);
  }

  it("Deeply matches objects within chains", () => {
    expect(test(Option.some({ a: 1 }))).to.equal("a 1");
    expect(test(Option.some({ a: 2 }))).to.equal("default");
    expect(test(Option.some({ a: 2, c: { d: 10 } }))).to.equal("cd 10");
  });
}

function chainedConditionsTest() {
  function test(input: Option<number>): string {
    return match(input, [
      [Option.some(35), "35"],
      [(n) => n.unwrapOr(0) > 30, "gt 30"],
      [(n) => n.unwrapOr(20) < 20, "lt 20"],
      () => "no match",
    ]);
  }

  it("Matches the chained branches based on conditions", () => {
    expect(test(Option.some(5))).to.equal("lt 20");
    expect(test(Option.some(25))).to.equal("no match");
    expect(test(Option.some(35))).to.equal("35");
    expect(test(Option.some(40))).to.equal("gt 30");
    expect(test(Option.none)).to.equal("no match");
  });
}

function combined() {
  combinedTest();
  combinedPartialTest;
}

function combinedTest() {
  function test(input: Option<number>): string {
    return match(input, {
      Some: [
        [1, "some 1"],
        [(n) => n > 10, "some gt 10"],
        () => "some default",
      ],
      None: () => "none",
    });
  }

  it("Matches chained branches within mapped branches", () => {
    expect(test(Option.some(1))).to.equal("some 1");
    expect(test(Option.some(14))).to.equal("some gt 10");
    expect(test(Option.some(5))).to.equal("some default");
    expect(test(Option.none)).to.equal("none");
  });
}

function combinedPartialTest() {
  function test(input: Option<number>): string {
    return match(input, {
      Some: [
        [1, "some 1"],
        [(n) => n > 10, "some gt 10"],
      ],
      _: () => "default",
    });
  }

  it("Falls back to the default case", () => {
    expect(test(Option.some(1))).to.equal("some 1");
    expect(test(Option.some(15))).to.equal("some gt 10");
    expect(test(Option.some(5))).to.equal("default");
    expect(test(Option.none)).to.equal("default");
  });
}
