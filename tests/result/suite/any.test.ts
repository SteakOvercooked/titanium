import { expect } from "chai";
import { Result } from "../../../src";

export default function any() {
  it("Should return the first Ok if any Ok is present", () =>
    expect(
      Result.any(
        Result.err("test_err"),
        Result.err("test_err_2"),
        Result.ok(1),
        Result.ok("test_string")
      ).unwrap()
    ).to.eql(1));

  it("Should return the first Err if any Err is present", () =>
    expect(
      Result.any(
        Result.err(1),
        Result.err("test_err"),
        Result.err({ a: 1, b: 2 }),
        Result.err("test_err_2")
      ).unwrapErr()
    ).to.eql([1, "test_err", { a: 1, b: 2 }, "test_err_2"]));
}
