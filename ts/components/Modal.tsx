/*
  A responsive modal wrapper:

    <Modal>
      <div className="content">
        Modal Content
      </div>
      </footer>Modal Footer</footer>
    </Modal>

  TODO: Testing
*/
require("less/components/_modals.less");
import * as React from "react";
import Icon from "./Icon";
import FocusTrap from "./FocusTrap";
import Overlay from "./Overlay";

const MODAL_CONTAINER_ID = "esper-modal";

interface BaseProps {
  children?: React.ReactNode|React.ReactNode[];
  onClose: () => void;
}

// Can use base class if need to customize header for some reason
export class ModalBase extends React.Component<BaseProps, {}> {
  render() {
    let { onClose, children } = this.props;
    let elm = <div className="backdrop" onClick={() => onClose()}>
      <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
        { children }
      </div>
    </div>;
    elm = <FocusTrap target={elm} />;
    return <Overlay id={MODAL_CONTAINER_ID} append={elm} />;
  }

  // Close modal on ESC
  componentDidMount() {
    document.addEventListener('keydown', this.onEsc);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onEsc)
  }

  onEsc = (e: Event) => {
    if (e instanceof KeyboardEvent) {
      if (e.keyCode === 27) {
        this.props.onClose();
      }
    }
  }
}


interface ModalProps extends BaseProps {
  header: React.ReactNode;
}

// Includes header
export function Modal({ children, header, onClose }: ModalProps) {
  return <ModalBase onClose={onClose}>
    <div className="modal">
      <header>
        <h3>{ header }</h3>
        <button className="close" onClick={() => onClose()}>
          <Icon type="close" />
        </button>
      </header>
      { children }
    </div>
  </ModalBase>;
}

export default Modal;