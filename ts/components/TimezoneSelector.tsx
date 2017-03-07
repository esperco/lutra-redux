/*
  Menu for selecting timezones
*/

import * as _ from "lodash";
import * as React from "react";
import { Choice } from "./Menu";
import FilterMenu from "./FilterMenu";
import { TimezoneSet, ZoneName, Zones } from "../lib/timezones";
import { ChoiceSet } from '../lib/util';

/* Convert between choice and ZoneName types */

function toChoice(z: ZoneName): Choice {
  return {
    original: z.display,
    normalized: z.searchFmt
  };
}

export function toZoneName(c: Choice): ZoneName {
  return _.find(Zones, (z) => z.searchFmt === c.normalized) || Zones[2];
}

interface Props {
  selected: string;
  onSelect: (val: string, method: "click"|"enter") => void;
}

class TimezoneSelector extends React.Component<Props, {}> {
  timezoneSet: TimezoneSet;

  constructor(props: Props) {
    super(props);
    this.timezoneSet = new TimezoneSet();
  }

  render() {
    let choices = new ChoiceSet(this.timezoneSet.map(toChoice));

    let filterFn =((filterStr: string): [Choice|undefined, Choice[]] => {
      let normFilter = filterStr.trim().toLowerCase();
      let filtered = this.timezoneSet.filter((z) => {
        return !!z.searchFmt && _.includes(z.searchFmt, normFilter);
      });
      let match = this.timezoneSet.getByKey(normFilter);

      return [
        match ? toChoice(match) : undefined,
        _.map(filtered.toList(), toChoice)
      ];
    });

    let selectedZone = _.find(this.timezoneSet.toList(),
      (z) => z.id === this.props.selected);
    let selected = selectedZone ? toChoice(selectedZone) : undefined;
    return <FilterMenu
      choices={choices}
      selected={selected}
      filterFn={filterFn}
      onSelect={(c, method) => this.props.onSelect(toZoneName(c).id, method)}
    />;
  }
}

export default TimezoneSelector;
