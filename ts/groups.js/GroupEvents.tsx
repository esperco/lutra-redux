/*
  This is the main view for the group page
*/

import * as React from 'react';
import { State, DispatchFn } from './types';
import GroupNav from "./GroupNav";
import GroupSelector from "./GroupSelector";
import { eventList } from "./paths";
import DelayedInput from "../components/DelayedInput";
import { renameGroup } from "../handlers/groups";
import { ready } from "../states/data-status";
import { ApiSvc } from "../lib/api";

class Props {
  groupId: string;
  state: State;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
}

class GroupEvents extends React.Component<Props, {}> {
  render() {
    let summary = this.props.state.groupSummaries[this.props.groupId];

    return <div>
      <GroupNav />
      <GroupSelector
        state={this.props.state}
        getHref={(groupId) => eventList.href({ groupId })}
      />

      { ready(summary) ?
        <DelayedInput
          value={summary.group_name}
          onUpdate={(name) => name ?
            renameGroup(this.props.groupId, name, this.props) :
            null
          }
        /> : null }

      <hr />

      Hello { this.props.state.name }, the counter has been
      clicked {this.props.state.counter} times.

      <br /><br />

      <input
        value={this.props.state.name}
        onChange={(e) => this.props.dispatch({
          type: "NAME_CHANGE",
          value: (e.target as HTMLInputElement).value
        })}
      />

      <br /><br />

      <button onClick={() => this.props.dispatch({
        type: "INCR",
        value: 1
      })}>
        Click Me!
      </button>
    </div>;
  }
}

export default GroupEvents;
