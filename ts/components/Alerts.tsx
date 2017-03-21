import * as _ from "lodash";
import * as React from "react";
import Icon from "./Icon";
import { hasTag } from "../lib/util";
import { AlertType } from "../states/alerts";
import { GoToGroupsMsg } from "../text/groups";
import * as GroupPaths from "../groups.js/paths";

interface Props {
  alerts: AlertType[];
  onDismiss: (alert: AlertType) => void;
}

export class Alerts extends React.Component<Props, {}> {
  render() {
    if (_.isEmpty(this.props.alerts)) return null;
    return <div className="alerts">
      { _.map(this.props.alerts || [], (alert, i) =>
        <div key={i} className="alert info">
          <button onClick={() => this.props.onDismiss(alert)}>
            <Icon type="dismiss" />
          </button>
          <span>
            { this.renderMsg(alert) }
          </span>
        </div>
      ) }
    </div>;
  }

  renderMsg(alert: AlertType) {
    if (hasTag("GO_TO_GROUPS", alert)) {
      return <a href={GroupPaths.base}>{ GoToGroupsMsg }</a>;
    }
    return null;
  }
}

export default Alerts;