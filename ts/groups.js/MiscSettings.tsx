/*
  This is the view that displays misc settings like removing a group
*/

import * as React from 'react';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import CSVDownload from "../components/CSVDownload";
import { RangeSelector } from "../components/CalendarSelectors";
import Dropdown from "../components/Dropdown";
import Icon from "../components/Icon";
import * as Groups from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import { GroupSummary } from "../states/groups";
import { Cancel } from "../text/common";
import * as Text from "../text/groups";
import { date as fmtDate } from "../text/periods";

interface Props {
  groupId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class MiscSettings extends React.Component<Props, {}> {
  render() {
    let summary = this.props.state.groupSummaries[this.props.groupId];
    let { Svcs, ...settingsProps } = this.props;
    return <div className="content">
      <div className="container">
        <SettingsNav {...settingsProps} />
        { ready(summary) ?
          this.renderContent(summary) :
          <div className="spinner" /> }
      </div>
    </div>;
  }

  renderContent(summary: GroupSummary) {
    let name = summary.group_name;
    return <div>
       <h3>{ Text.ExportCSVHeading }</h3>
      <CSVDownloadWidget {...this.props} />

      <h3>{ Text.RemoveGroupHeading }</h3>
      <Deactivate {...this.props} name={name} />
    </div>;
  }
}

interface DownloadState {
  range?: [Date, Date]
}

class CSVDownloadWidget extends React.Component<Props, DownloadState> {
  _dropdown: Dropdown|null;

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    let cb = this.props.Svcs.Api.postForGroupCalendarEventsCSV;
    return <div className="panel">
      { Text.ExportCSVDescription }
      <div className="action-row">
        <div>
          <Dropdown
            ref={(c) => this._dropdown = c}
            keepOpen={true}
            toggle={<button>
              <Icon type="calendar" />
                { this.state.range ?
                  fmtDate(this.state.range[0]) + " - " + 
                  fmtDate(this.state.range[1]) :
                  Text.ExportSelectText }
              <Icon type="caret-down" />
            </button>}
            menu={<div className="dropdown-menu">
              <RangeSelector 
                value={this.state.range}
                onChange={(range) => {
                  this.setState({ range });
                  this._dropdown && this._dropdown.close();
                }}
              />
            </div>}
          />
        </div>
        <CSVDownload 
          disabled={!this.state.range}
          getCSV={() => this.state.range ?
            cb(this.props.groupId, {
              window_start: this.state.range[0].toISOString(),
              window_end: this.state.range[1].toISOString() 
            }) :
            Promise.reject(new Error("No date selected"))
          }
        />
      </div>
    </div>;
  }
}

const Deactivate = (props: Props & { name: string }) => {
  return <div className="panel">
    <div className="action-row">
      <p>
        { Text.removeGroupDescription(props.name) }
      </p>
      <div>
        <Dropdown
          toggle={<button>
            { Text.RemoveGroupBtn }
          </button>}
          menu={<div className="dropdown-menu">
            <p>
              { Text.RemoveGroupConf }
            </p>
            <div className="row">
              <button>{ Cancel }</button>
              <button className="danger" onClick={
                () => Groups.deleteGroup(props.groupId, props)
              }>
                { Text.RemoveGroupConfYes }
              </button>
            </div>
          </div>}
        />
      </div>
    </div>
  </div>
};

export default MiscSettings;
