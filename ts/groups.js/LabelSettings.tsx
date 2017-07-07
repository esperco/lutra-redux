/*
  Manage group labels
*/

import * as React from 'react';
import { LoggedInState, DispatchFn } from './types';
import ColorPicker from "../components/ColorPicker";
import Dropdown from "../components/Dropdown";
import Icon from "../components/Icon";
import SubmitInput from "../components/SubmitInput";
import SettingsNav from "./SettingsNav";
import * as Groups from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { newLabel } from "../lib/event-labels";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as Text from "../text/labels";

interface Props {
  groupId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class LabelSettings extends React.Component<Props, {}> {
  render() {
    let labels = this.props.state.groupLabels[this.props.groupId];
    let { Svcs, ...settingsProps } = this.props;
    return <div className="content">
      <div className="container">
        <SettingsNav {...settingsProps} />

        { ready(labels) ?
          <div className="panel">
            { labels.group_labels.map((l) => <GroupLabel
              {...this.props}
              key={l.normalized}
              label={l}
            />) }
            <AddLabel {...this.props} />
          </div> : <div className="spinner" /> }
      </div>
    </div>;
  }
}

interface Subprops extends Props {
  label: ApiT.LabelInfo;
}

class GroupLabel extends React.Component<Subprops, {}> {
  render() {
    let style = {
      background: this.props.label.color
    };

    return <div className="row">
      <Dropdown
        toggle={<button className="dropdown-toggle">
          <span className="color-box" style={style} />
        </button>}

        menu={<div className="dropdown-menu">
          <ColorPicker
            value={this.props.label.color}
            onChange={this.updateColor}
          />
        </div>}
      />

      <span>{ this.props.label.original }</span>

      <Dropdown
        toggle={<button className="dropdown-toggle">
          <Icon type="options" />
        </button>}

        menu={<div className="dropdown-menu">
          <div className="menu panel">
            <button onClick={this.archive}>
              <Icon type="archive">
                { Text.ArchiveLabel }
              </Icon>
              <p className="description">
                { Text.ArchiveLabelDescription }
              </p>
            </button>
          </div>
        </div>}
      />
    </div>;
  }

  archive = () => {
    Groups.setGroupLabels({
      groupId: this.props.groupId,
      rmLabels: [this.props.label]
    }, this.props);
  }

  updateColor = (color: string) => {
    // Updating color is just adding the old label with a new color
    Groups.setGroupLabels({
      groupId: this.props.groupId,
      addLabels: [{ ...this.props.label, color }]
    }, this.props);
  }
}

class AddLabel extends React.Component<Props, {}> {
  _ref: SubmitInput;

  render() {
    return <footer>
      <SubmitInput
        ref={(c) => this._ref = c}
        placeholder={Text.NewLabelPlaceholder}
        onSubmit={this.addLabel}
      />
      <button onClick={this.addLabel}>
        <Icon type="add" />
      </button>
    </footer>;
  }

  addLabel = () => {
    if (this._ref) {
      let val = this._ref.val().trim();
      if (val) {
        Groups.setGroupLabels({
          groupId: this.props.groupId,
          addLabels: [newLabel(val)]
        }, this.props);
        this._ref.reset();
      }
    }
  }
}

export default LabelSettings;
