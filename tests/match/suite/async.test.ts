import { expect } from "chai";
import { Option, Result, match } from "../../../src";

export default function async_() {
  describe("Mapped", mapped);
  describe("Chained", chained);
}

function mapped() {
  function test(val: Option<Result<string, number>>) {
    return match(val, {
      Some: {
        Ok: async (str) => `ok ${str}`,
        Err: async (num) => `err ${num}`,
      },
      _: async () => "none",
    });
  }

  it("Matches Ok within Some", async () =>
    expect(await test(Option.some(Result.ok("test")))).to.equal("ok test"));
  it("Matches Err within Some", async () =>
    expect(await test(Option.some(Result.err(1)))).to.equal("err 1"));
  it("Matches None", async () =>
    expect(await test(Option.none)).to.equal("none"));
}

function chained() {
  function test(val: Option<Result<string, number>>) {
    return match(val, [
      [Option.some(Result.ok("test")), async () => `some ok`],
      [Option.some(Result.err(1)), async () => `some err`],
      [Option.none, async () => "none"],
      async () => "no match",
    ]);
  }

  it("Matches Ok within Some", async () =>
    expect(await test(Option.some(Result.ok("test")))).to.equal("some ok"));
  it("Matches Err within Some", async () =>
    expect(await test(Option.some(Result.err(1)))).to.equal("some err"));
  it("Matches None", async () =>
    expect(await test(Option.none)).to.equal("none"));
  it("Returns the default when there is no match", async () =>
    expect(await test(Option.some(Result.ok("no match")))).to.equal(
      "no match"
    ));
}
