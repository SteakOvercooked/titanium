import { expect } from "chai";
import { Option, Result, match } from "../../../src";

export default function compile() {
  it("Should compile from mapped Option branches", () => {
    const test = match.compile({
      Some: (n: number) => `some ${n}`,
      None: () => "none",
    });

    expect(test(Option.some(1))).to.equal("some 1");
    expect(test(Option.none)).to.equal("none");
  });

  it("Should compile from mapped Result branches", () => {
    const test = match.compile({
      Ok: (n: number) => `ok ${n}`,
      Err: (s: string) => `err ${s}`,
    });

    expect(test(Result.ok(1))).to.equal("ok 1");
    expect(test(Result.err("test"))).to.equal("err test");
  });

  it("Should compile from chained branches", () => {
    const test = match.compile([
      [1, "one"],
      [2, "two"],
      [(n) => n > 20, ">20"],
      () => "default",
    ]);

    expect(test(1)).to.equal("one");
    expect(test(2)).to.equal("two");
    expect(test(30)).to.equal(">20");
    expect(test(5)).to.equal("default");
  });
}
