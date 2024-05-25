import { expect } from "chai";
import { Option } from "../../../src";

export default function all() {
  it("Should return a Some tuple when all results are Some", () =>
    expect(
      Option.all(
        Option.some(1),
        Option.some("test_string"),
        Option.some(true),
        Option.some({ a: 1, b: 2 })
      ).unwrap()
    ).to.eql([1, "test_string", true, { a: 1, b: 2 }]));

  it("Should return the first Err if any Err is present", () =>
    expect(
      Option.all(
        Option.some(1),
        Option.some("test_string"),
        Option.none,
        Option.some({ a: 1, b: 2 }),
        Option.none
      ).isNone()
    ).to.be.true);
}
