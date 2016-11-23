import * as _ from "lodash";
import * as React from "react";
import { LoginState } from "../lib/login";
import { GroupSummary, GroupState } from "../states/groups";
import { StoreData, ready } from "../states/data-status";

interface Props {
  state: LoginState & GroupState;
  getHref: (groupid: string) => string;
}

export class GroupSelector extends React.Component<Props, {}> {
  render() {
    let state = this.props.state;
    if (! state.login) return null;

    return <div>
      { _.map(state.login.groups, (groupid) =>
        <GroupLink key={groupid} id={groupid}
          summary={state.groupSummaries[groupid]}
          getHref={this.props.getHref}
        />) }
    </div>;
  }
}

export default GroupSelector;

export function GroupLink({id, summary, getHref}: {
  id: string;
  summary?: StoreData<GroupSummary>;
  getHref: (groupid: string) => string;
}) {
  return <a href={getHref(id)}>
    { ready(summary) ?
      <span>{ summary.group_name }</span> :
      <span className="text-loading" /> }
  </a>;
}