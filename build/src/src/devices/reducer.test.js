import reducer from "devices/reducer";
import * as t from "devices/actionTypes";

describe("Request reducer", () => {
  it("has a default state", () => {
    expect(reducer(undefined, { type: undefined })).toEqual({
      fetching: false,
      devices: []
    });
  });

  it("has a default state", () => {
    const devices = ["jordi"];
    expect(
      reducer(undefined, {
        type: "UPDATE_DEVICES",
        devices
      })
    ).toEqual({
      fetching: false,
      devices
    });
  });
});
