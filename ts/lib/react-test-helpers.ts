import { ReactWrapper, ShallowWrapper } from "enzyme";

export function simulateInput(
  wrapper: ReactWrapper<any, any>|ShallowWrapper<any, any>,
  text: string
) {
  wrapper.simulate("change", {
    target: { value: text }
  });
}

export function simulateEnter(
  wrapper: ReactWrapper<any, any>|ShallowWrapper<any, any>,
) {
  wrapper.simulate('keyDown', {
    keyCode: 13,
    preventDefault: () => null
  });
}

export function simulateEsc(
  wrapper: ReactWrapper<any, any>|ShallowWrapper<any, any>,
) {
  wrapper.simulate('keyDown', {
    keyCode: 27,
    preventDefault: () => null
  });
}