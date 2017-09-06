/*
  CSV downloader -- button that calls some handler that returns a promise
  for a string. Opens a modal that displays status for promise. When
  promise resolves, renders a link to download a CSV file from returned data.
  Closing modal cancels download action.
*/

import * as React from "react";
import * as Util from "../lib/util"
import * as Text from "../text/common";
import { GenericErrorMsg } from "../text/error-text";
import { ModalBase } from "./Modal";
import Icon from "./Icon";

export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  getCSV: () => Promise<string>;
}

type Status =
  { type: "busy"; id: string; }|
  { type: "error"; }|
  { type: "ready"; data: string; };

type State = {
  status?: Status // Undefined = not started, canceled
};
  
export class CSVDownload extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    let { onClick, getCSV, ...props } = this.props;
    return <span>
      <button {...props} onClick={this.onClick}>
        <Icon type="download">{ Text.Download }</Icon>
      </button>
      
      { this.state.status ? <ModalBase onClose={this.onClose}>
        <div className="modal">
          { this.renderModalContent(this.state.status) }
        </div>
      </ModalBase> : null }
    </span>;
  }

  renderModalContent(status: Status) {
    switch (status.type) {
      case 'busy':
        return <div className="spinner" />;
      case 'error':
        return <div className="alert danger">
          { GenericErrorMsg }
        </div>;
      case 'ready':
        return <a 
          download="esper.csv"
          href={"data:text/csv;charset=utf-8," + status.data}
        >
          <Icon type="download">
            { Text.DownloadReady }
          </Icon>
        </a>;
    }
  }

  onClick = async () => {
    const id = Util.randomString();
    this.setState({ 
      status: { 
        type: "busy", id 
      }
    });

    try {
      let data = await this.props.getCSV();
      
      // Only update state with data if we're still on same API call
      let { status } = this.state;
      if (status && status.type === "busy" && status.id === id) {
        this.setState({
          status: {
            type: "ready",
            data: encodeURIComponent(data)
          }
        })
      }
    }
    
    catch(err) {
      this.setState({ status: { type: "error" }})
    }
  };

  onClose = () => this.setState({ status: undefined });
}

export default CSVDownload;