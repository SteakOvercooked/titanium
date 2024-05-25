import { expect } from "chai";
import { Option } from "../../../src";

export default function any() {
  it("Should return an Ok tuple when all results are Ok", () =>
    expect(
      Option.any(
        Option.none,
        Option.none,
        Option.some(1),
        Option.some("test_string")
      ).unwrap()
    ).to.equal(1));

  it("Should return the first Err if any Err is present", () =>
    expect(Option.any(Option.none, Option.none, Option.none).isNone()).to.be
      .true);
}
