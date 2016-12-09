import * as _ from "lodash";
import * as React from "react";
import { LoginState } from "../lib/login";
import { GroupSummary, GroupState } from "../states/groups";
import { StoreData, ready } from "../states/data-status";

interface Props {
  selected?: string;
  state: LoginState & GroupState;
  getHref: (groupid: string) => string;
}

export class GroupSelector extends React.Component<Props, {}> {
  render() {
    let state = this.props.state;
    if (! state.login) return null;

    return <nav>
      { _.map(state.login.groups, (groupid) =>
        <GroupLink key={groupid} id={groupid}
          selected={this.props.selected === groupid}
          summary={state.groupSummaries[groupid]}
          getHref={this.props.getHref}
        />) }
    </nav>;
  }
}

export default GroupSelector;

export function GroupLink({id, selected, summary, getHref}: {
  id: string;
  selected?: boolean;
  summary?: StoreData<GroupSummary>;
  getHref: (groupid: string) => string;
}) {
  return <a className={selected ? "active" : ""} href={getHref(id)}>
    { ready(summary) ?
      <span>{ summary.group_name }</span> :
      <span className="placeholder" /> }
  </a>;
}