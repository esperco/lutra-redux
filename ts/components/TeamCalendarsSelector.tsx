/*
  Component for adding / removing calendars from a team
*/

import * as _ from 'lodash';
import * as React from 'react';
import CheckboxItem from "./CheckboxItem";
import * as ApiT from "../lib/apiT";

interface Props {
  available: ApiT.GenericCalendar[];
  selected: ApiT.GenericCalendar[];
  onChange: (cal: ApiT.GenericCalendar, val: boolean) => void;
}

export class TeamCalendarsSelector extends React.Component<Props, {}> {
  render() {
    let selected: Record<string, true> = {};
    _.each(this.props.selected, (s) => selected[s.id] = true)

    return <div className="menu">
      { _.map(this.props.available,
        (c) => <CheckboxItem key={c.id}
          checked={!!selected[c.id]}
          onChange={(v) => this.props.onChange(c, v)}>
          { c.title }
        </CheckboxItem>)}
    </div>
  }
}

export default TeamCalendarsSelector;