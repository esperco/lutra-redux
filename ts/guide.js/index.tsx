/*
  Some things in guide are really React components
*/

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as $ from "jquery";
import CheckboxItem from "../components/CheckboxItem"
import RadioItem from "../components/RadioItem"
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import Tooltip from "../components/Tooltip";
import ColorPicker from "../components/ColorPicker";
import { RangeSelector } from "../components/CalendarSelectors";

// Selectors
ReactDOM.render(<div className="flex">
  {/* Checkboxes */}
  <div>
    <CheckboxItem onChange={(v) => console.log("Checkbox is " + v)}>
      Basic Checkbox
    </CheckboxItem>
    <CheckboxItem
      onChange={(v) => console.log("Checkbox is " + v)}
      background="#0080ce" color="#fcfcfc"
    >
      Colorful Checkbox
    </CheckboxItem>
  </div>

  {/* Radio buttons */}
  <div>
    <RadioItem name="radio-test"
      onChange={(v) => console.log("Radio 1 is " + v)}
    >
      Basic Radio Button
    </RadioItem>
    <RadioItem name="radio-test"
      onChange={(v) => console.log("Radio 2 is " + v)}
      background="#0080ce" color="#fcfcfc"
    >
      Colorful Radio Button
    </RadioItem>
  </div>
</div>, $("#selector-demo").get(0));

ReactDOM.render(<div>
  <div className="panel"><div className="menu">
    <CheckboxItem onChange={(v) => console.log("Checkbox is " + v)}>
      Basic Checkbox
    </CheckboxItem>
    <CheckboxItem
      onChange={(v) => console.log("Checkbox is " + v)}
      background="#0080ce" color="#fcfcfc"
    >
      Colorful Checkbox
    </CheckboxItem>
  </div></div>

  <div className="panel"><div className="menu">
    <RadioItem name="radio-panel-test"
      onChange={(v) => console.log("Radio 1 is " + v)}
    >
      Basic Radio Button
    </RadioItem>
    <RadioItem name="radio-panel-test"
      onChange={(v) => console.log("Radio 2 is " + v)}
      background="#0080ce" color="#fcfcfc"
    >
      Colorful Radio Button
    </RadioItem>
  </div></div>
</div>, $("#selector-panel-demo").get(0));


// Dropdown
ReactDOM.render(<div>
  <Dropdown
    toggle={<button>
      Basic Dropdown
    </button>}

    menu={<div className="dropdown-menu">
      <h4>Dropdown menu options</h4>
      <nav className="panel">
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
        <a href="#">Link 3</a>
      </nav>
      <div className="menu panel">
        <button>Button</button>
      </div>
    </div>}
  />

  <Dropdown keepOpen={true}
    toggle={<button>
      Dropdown That Stays Open
    </button>}

    menu={<div className="dropdown-menu">
      <h4>Dropdown menu options</h4>
      <div className="menu">
        <CheckboxItem onChange={(v) => console.log("Checkbox 1 is " + v)}>
          Checkbox 1
        </CheckboxItem>
        <CheckboxItem onChange={(v) => console.log("Checkbox 2 is " + v)}>
          Checkbox 2
        </CheckboxItem>
        <CheckboxItem onChange={(v) => console.log("Checkbox 3 is " + v)}>
          Checkbox 3
        </CheckboxItem>
        <CheckboxItem onChange={(v) => console.log("Checkbox 4 is " + v)}>
          Checkbox 4
        </CheckboxItem>
      </div>
    </div>}
  />
</div>, $("#dropdown-demo").get(0));


// Modal
class ModalDemo extends React.Component<{}, { open: boolean; }> {
  constructor(props: {}) {
    super(props);
    this.state = { open: false };
  }

  render() {
    return <div>
      <button onClick={() => this.setState({ open: true })}>
        Open Modal
      </button>
      { this.state.open ? this.renderModal() : null}
    </div>;
  }

  renderModal() {
    return <Modal header="Modal"
                  onClose={() => this.setState({ open: false })}>
      <div className="content">
        <div>Some modal content</div>
      </div>
      <footer>
        Static modal footer
      </footer>
    </Modal>;
  }
}

ReactDOM.render(<ModalDemo />, $("#modal-demo").get(0));


/* Tooltips */
ReactDOM.render(<div>
  <Tooltip
    target={<button>
      Hover Over Me
    </button>}
    title={"A bit of helpful text. The tooltip should adjust itself to " +
           "avoid clipping the borders of the window."}
  />
</div>, $("#tooltip-demo").get(0));


/* Color picker */
class ColorPickerDemo extends React.Component<{}, {
  value?: string;
}> {
  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  render() {
    return <ColorPicker
      value={this.state.value}
      onChange={(value) => this.setState({ value })}
    />;
  }
}

ReactDOM.render(<div>
  <ColorPickerDemo />
</div>, $("#color-picker-demo").get(0))


/* Calendars */
class RangeSelectorDemo extends React.Component<{}, {
  value?: [Date, Date];
}> {
  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  render() {
    return <RangeSelector
      value={this.state.value}
      onChange={(value) => this.setState({ value })}
    />;
  }
}

ReactDOM.render(<div>
  <RangeSelectorDemo />
</div>, $("#range-selector-demo").get(0));
