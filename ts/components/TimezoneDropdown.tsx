import * as React from 'react';
import { Zones } from "../lib/timezones";
import Dropdown from "./Dropdown";
import TimezoneSelector from "./TimezoneSelector";

interface Props {
  disabled?: boolean;
  value: string;
  onChange: (val: string) => void;
}

export const TimezoneDropdown = (props: Props) => {
  let timezone = Zones.find((z) => z.id === props.value);
  let zoneName = timezone ? timezone.display : "";
  return props.disabled ?
    <input type="text" readOnly disabled value={zoneName} /> :
    <Dropdown
      toggle={<button className="input-style">
        {zoneName}
      </button>}
      menu={<div className="dropdown-menu">
        <TimezoneSelector
          selected={props.value}
          onSelect={props.onChange} />
      </div>}
    />
}

export default TimezoneDropdown;