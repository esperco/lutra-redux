/*
  Component for adding / removing calendars from a team
*/

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
    this.props.selected.forEach((s) => selected[s.id] = true);

    return <div className="menu">
      { this.props.available.map((c) => <CheckboxItem key={c.id}
          checked={!!selected[c.id]}
          onChange={(v) => this.props.onChange(c, v)}>
          { c.title }
        </CheckboxItem>)}
    </div>
  }
}

export default TeamCalendarsSelector;