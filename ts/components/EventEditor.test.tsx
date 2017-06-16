// import * as React from 'react';
// import * as Sinon from 'sinon';
// import { expect } from "chai";
// import { mount } from 'enzyme';
// import EventEditor, { Props } from "./EventEditor";
// import makeEvent from "../fakes/events-fake";
// import { stubRAF, stubTimeouts } from "../fakes/stubs";
// import { LabelSet } from "../lib/event-labels";

// describe("<EventEditor />", () => {
//   const event = makeEvent({ labels_confirmed: false });

//   /* Timeout stubs */
//   var timeouts: {
//     fn: Function;
//     time: number;
//     cleared?: boolean;
//   }[] = [];

//   beforeEach(() => {
//     stubRAF();
//     timeouts = stubTimeouts();
//   });

//   function makeEditor(props: Partial<Props>) {
//     let fullProps: Props = {
//       event: "FETCHING",
//       members: undefined,
//       labels: new LabelSet([]),
//       searchLabels: new LabelSet([]),
//       loginDetails: undefined,
//       onChange: () => null,
//       onForceInstance: () => null,
//       onHide: () => null,
//       ...props
//     };
//     return mount(<EventEditor {...fullProps} />);
//   }

//   it("renders placeholder if passed FETCHING", () => {
//     expect(makeEditor({ event: "FETCHING" }).find('.placeholder'))
//       .to.have.length.greaterThan(0);
//   });

//   it("sets timeout to confirm event", () => {
//     let spy = Sinon.spy();
//     makeEditor({ event, onConfirm: spy, autoConfirmTimeout: 1234 });
//     expect(timeouts).to.have.length(1);
//     expect(timeouts[0].time).to.equal(1234);

//     expect(spy.called).to.be.false;
//     timeouts[0].fn();
//     expect(spy.called).to.be.true;
//   });

//   it("clears timeout when unmounted", () => {
//     makeEditor({ event }).unmount();
//     expect(timeouts[0].cleared).to.be.ok;
//   });

//   it("resets timeout when we get a new event", () => {
//     makeEditor({ event, onConfirm: () => null }).setProps({
//       event: makeEvent({ id: "new-id-2", labels_confirmed: false })
//     });
//     expect(timeouts).to.have.length(2);
//     expect(timeouts[0].cleared).to.be.ok;
//   });

//   it("sets timeout when transitioning from FETCHING to a new event", () => {
//     let wrapper = makeEditor({ event: "FETCHING", onConfirm: () => null });
//     expect(timeouts).to.have.length(0);

//     wrapper.setProps({ event });
//     expect(timeouts).to.have.length(1);
//   });
// });
