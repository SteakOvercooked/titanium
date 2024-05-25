import { expect } from "chai";
import { Result, match, _ } from "../../../src";

export default function result() {
  describe("Mapped", mapped);
  describe("Chained", chained);
  describe("Combined (chained within mapped)", combined);
}

function mapped() {
  function test(input: Result<number, string>): string {
    return match(input, {
      Ok: (n) => `ok ${n}`,
      Err: (n) => `err ${n}`,
    });
  }

  it("Executes the mapped Ok branch", () =>
    expect(test(Result.ok(1))).to.equal("ok 1"));
  it("Executes the mapped Err branch", () =>
    expect(test(Result.err("err"))).to.equal("err err"));
  it("Throws when there is no matching branch", () =>
    expect(() =>
      match(Result.ok(1), {
        Err: () => true, //
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
  function test(input: Result<number, string>): string {
    return match(input, [
      [Result.ok(1), "ok 1"],
      [Result.err("err"), "err err"],
      [Result.ok(_), "ok default"],
      [Result.err(_), "err default"],
    ]);
  }

  it("Matches the chained branches", () => {
    expect(test(Result.ok(1))).to.equal("ok 1");
    expect(test(Result.ok(2))).to.equal("ok default");
    expect(test(Result.err("err"))).to.equal("err err");
    expect(test(Result.err("nomatch"))).to.equal("err default");
  });
}
function chainedArrayTest() {
  function test(input: Result<number[], string[]>): string {
    return match(input, [
      [Result.ok([1, 2]), "ok 1 2"],
      [Result.ok([2, _, 6]), "ok 2 _ 6"],
      [Result.err(["a", "b"]), "err a b"],
      [Result.err([_, "c", "d"]), "err _ c d"],
      () => "default",
    ]);
  }

  it("Should deeply match arrays in chains", () => {
    expect(test(Result.ok([1, 2, 3]))).to.equal("ok 1 2");
    expect(test(Result.ok([2, 4, 6]))).to.equal("ok 2 _ 6");
    expect(test(Result.ok([2, 3, 4]))).to.equal("default");
    expect(test(Result.err(["a", "b", "c"]))).to.equal("err a b");
    expect(test(Result.err(["b", "c", "d"]))).to.equal("err _ c d");
    expect(test(Result.err(["c", "d", "e"]))).to.equal("default");
  });
}

function chainedObjectTest() {
  function test(
    input: Result<
      { a: number; c?: { d: number } },
      { b: number; c?: { d: number } }
    >
  ): string {
    return match(input, [
      [Result.ok({ a: 1 }), "ok a 1"],
      [Result.err({ b: 1 }), "err b 1"],
      [Result.ok({ c: { d: 10 } }), "ok cd 10"],
      [Result.err({ c: { d: 5 } }), "err cd 5"],
      () => "default",
    ]);
  }

  it("Should deeply match objects in chains", () => {
    expect(test(Result.ok({ a: 1 }))).to.equal("ok a 1");
    expect(test(Result.ok({ a: 2, c: { d: 5 } }))).to.equal("default");
    expect(test(Result.ok({ a: 2, c: { d: 10 } }))).to.equal("ok cd 10");
    expect(test(Result.err({ b: 1 }))).to.equal("err b 1");
    expect(test(Result.err({ b: 2, c: { d: 10 } }))).to.equal("default");
    expect(test(Result.err({ b: 2, c: { d: 5 } }))).to.equal("err cd 5");
  });
}

function chainedConditionsTest() {
  function test(input: Result<number, string>): string {
    return match(input, [
      [Result.ok(35), "ok 35"],
      [(n) => n.unwrapOr(0) > 30, "ok gt 30"],
      [(n) => n.unwrapOr(10) < 10, "ok lt 10"],
      [Result.err("err"), "err err"],
      [(str) => str.isErr() && str.unwrapErr().startsWith("a"), "err a"],
      () => "no match",
    ]);
  }

  it("Matches chained branches based on conditions", () => {
    expect(test(Result.ok(5))).to.equal("ok lt 10");
    expect(test(Result.ok(25))).to.equal("no match");
    expect(test(Result.ok(35))).to.equal("ok 35");
    expect(test(Result.ok(40))).to.equal("ok gt 30");
    expect(test(Result.err("err"))).to.equal("err err");
    expect(test(Result.err("abc"))).to.equal("err a");
    expect(test(Result.err("def"))).to.equal("no match");
  });
}

function combined() {
  combinedTest();
  combinedPartialTest;
}

function combinedTest() {
  function test(input: Result<number, string>): string {
    return match(input, {
      Ok: [
        [1, "ok 1"], //
        [(n) => n > 10, "ok gt 10"],
        () => "ok default",
      ],
      Err: [
        ["err", "err err"],
        [(str) => str.startsWith("a"), "err a"],
        () => "err default",
      ],
    });
  }

  it("Matches chained branches within mapped branches", () => {
    expect(test(Result.ok(1))).to.equal("ok 1");
    expect(test(Result.ok(15))).to.equal("ok gt 10");
    expect(test(Result.ok(5))).to.equal("ok default");
    expect(test(Result.err("err"))).to.equal("err err");
    expect(test(Result.err("abc"))).to.equal("err a");
    expect(test(Result.err("def"))).to.equal("err default");
  });
}

function combinedPartialTest() {
  function test(input: Result<number, string>): string {
    return match(input, {
      Ok: [
        [1, "ok 1"],
        [(n) => n > 10, "ok gt 10"],
      ],
      Err: [["err", "err err"]],
      _: () => "default",
    });
  }

  it("Falls back to the default case", () => {
    expect(test(Result.ok(1))).to.equal("ok 1");
    expect(test(Result.ok(15))).to.equal("ok gt 10");
    expect(test(Result.err("err"))).to.equal("err err");
    expect(test(Result.ok(5))).to.equal("default");
    expect(test(Result.err("nomatch"))).to.equal("default");
  });
}
