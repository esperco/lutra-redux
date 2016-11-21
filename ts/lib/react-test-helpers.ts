import { ReactWrapper, ShallowWrapper } from "enzyme";

export function simulateInput(
  wrapper: ReactWrapper<any, any>|ShallowWrapper<any, any>,
  text: string
) {
  wrapper.simulate("change", {
    target: { value: text }
  });
}