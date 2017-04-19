/*
  Single event view
*/

import * as React from 'react';
import * as _ from 'lodash';
import { LoggedInState, DispatchFn } from './types';
import Icon from "../components/Icon";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { NavSvc } from "../lib/routing";
import * as Now from "../now.js/paths";
import * as Groups from "../groups.js/paths";
import { ready } from "../states/data-status";
import { GroupSummary } from "../states/groups";
import * as Text from "../text/events-page";
import * as CommonText from "../text/common";

interface Props {
  eventId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

export class EventView extends React.Component<Props, {}> {
  render() {
    let { state, eventId } = this.props;
    let groupIds = state.login.groups;
    let teams = _.filter(state.login.teams, (t) => !t.groups_only);
    return <div id="event" className="container"><div className="panel">
      <header><h2>{ Text.SelectTeamHeading }</h2></header>

      { groupIds.length ? <section className="panel">
        <h3><Icon type="people">{ CommonText.GroupsLink }</Icon></h3>
        <nav> { _.map(groupIds, (id) => {
          let summary = state.groupSummaries[id];
          return ready(summary) ?
            <Group key={id} group={summary} groupId={id} eventId={eventId} /> :
            <div key={id} className="placeholder" />;
        }) }</nav>
      </section> : null }

      { teams.length ? <section className="panel">
        <h3><Icon type="person">{ CommonText.ExecLink }</Icon></h3>
        <nav>{ _.map(teams,
          (team) => <Team key={team.teamid} team={team} eventId={eventId} />
        ) }</nav>
      </section>: null }
    </div></div>;
  }
}


interface GroupProps {
  eventId: string;
  groupId: string;
  group: GroupSummary;
}

class Group extends React.Component<GroupProps, {}> {
  render() {
    let url = Groups.eventList.href({
      groupId: this.props.groupId,
      eventId: this.props.eventId
    });
    return <a href={url}>{ this.props.group.group_name }</a>;
  }
}


interface TeamProps {
  eventId: string;
  team: ApiT.Team;
}

class Team extends React.Component<TeamProps, {}> {
  render() {
    let url = Now.Event.href({
      eventId: this.props.eventId,
      team: this.props.team.teamid
    });
    return <a href={url}>{ this.props.team.team_name }</a>;
  }
}

export default EventView;
