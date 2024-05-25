import { expect } from "chai";
import { Result } from "../../../src";

export default function all() {
  it("Should return an Ok tuple when all results are Ok", () =>
    expect(
      Result.all(
        Result.ok(1),
        Result.ok("test_string"),
        Result.ok(true),
        Result.ok({ a: 1, b: 2 })
      ).unwrap()
    ).to.eql([1, "test_string", true, { a: 1, b: 2 }]));

  it("Should return the first Err if any Err is present", () =>
    expect(
      Result.all(
        Result.ok(1),
        Result.ok("two"),
        Result.err("test_err"),
        Result.ok({ a: 1, b: 2 }),
        Result.err("test_err_2")
      ).unwrapErr()
    ).to.equal("test_err"));
}
