import { expect } from "chai";
import { Option, Result, match } from "../../../src";

export default function nesting() {
  describe("Mapped", mapped);
  describe("Chained", chained);
}

function mapped() {
  mappedNestingTest();
  closestDefaultTest();
}

function mappedNestingTest() {
  function test(val: Result<Option<Result<number, number>>, number>): string {
    return match(val, {
      Ok: {
        Some: {
          Ok: (n) => `ok ${n}`,
          Err: (e) => `err b ${e}`,
        },
        None: () => "none",
      },
      Err: (e) => `err a ${e}`,
    });
  }

  it("Matches", () => {
    expect(test(Result.ok(Option.some(Result.ok(1))))).to.equal("ok 1");
    expect(test(Result.ok(Option.some(Result.err(1))))).to.equal("err b 1");
    expect(test(Result.ok(Option.none))).to.equal("none");
    expect(test(Result.err(1))).to.equal("err a 1");
  });
}

function closestDefaultTest() {
  function test(val: Result<Option<Result<number, string>>, number>): string {
    return match(val, {
      Ok: {
        Some: {
          Ok: (n) => `ok ${n}`,
          _: () => "inner default",
        },
      },
      _: () => "default",
    });
  }

  it("Falls back to the closest default", () => {
    expect(test(Result.ok(Option.some(Result.ok(1))))).to.equal("ok 1");
    expect(test(Result.ok(Option.some(Result.err("_"))))).to.equal(
      "inner default"
    );
    expect(test(Result.ok(Option.none))).to.equal("default");
    expect(test(Result.err(1))).to.equal("default");
  });
}

function chained() {
  function test(val: Result<Option<Result<number, string>>, number>): string {
    return match(val, [
      [Result.ok(Option.some(Result.ok(1))), "ok some ok"],
      [Result.ok(Option.some(Result.err("err"))), "ok some err"],
      [Result.ok(Option.none), "ok none"],
      [Result.err(1), "err"],
      () => "default",
    ]);
  }

  it("Matches", () => {
    expect(test(Result.ok(Option.some(Result.ok(1))))).to.equal("ok some ok");
    expect(test(Result.ok(Option.some(Result.ok(2))))).to.equal("default");
    expect(test(Result.ok(Option.some(Result.err("err"))))).to.equal(
      "ok some err"
    );
    expect(test(Result.ok(Option.some(Result.err("nomatch"))))).to.equal(
      "default"
    );
    expect(test(Result.ok(Option.none))).to.equal("ok none");
    expect(test(Result.err(1))).to.equal("err");
    expect(test(Result.err(2))).to.equal("default");
  });
}
