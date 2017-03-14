import * as React from "react";
import CheckboxItem from "./CheckboxItem";
import * as Text from "../text/timebomb";

export interface TBSettings {
  enabled: boolean;
  minGuests: number;
  maxGuests: number;
}

interface Props {
  value: TBSettings;
  onChange: (val: TBSettings) => any;
}

export const TimebombSettings = ({ value, onChange } : Props) => {
  return <div>
    <CheckboxItem
        checked={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}>
      { Text.TimebombDefault }
    </CheckboxItem>

    <div className="form-row">
      <label htmlFor="tb-min-guests">
        { Text.TimebombMinGuests }
      </label>
      <input id="tb-min-guests" type="number" min="0"
        value={value.minGuests}
        onChange={(e) => onChange({
          ...value,
          minGuests: parseInt(e.currentTarget.value)
        })} />
    </div>

    <div className="form-row">
      <label htmlFor="tb-max-guests">
        { Text.TimebombMaxGuests }
      </label>
      <input id="tb-max-guests" type="number" min="0"
        value={value.maxGuests}
        onChange={(e) => onChange({
          ...value,
          maxGuests: parseInt(e.currentTarget.value)
        })} />
    </div>
  </div>;
}

export default TimebombSettings;