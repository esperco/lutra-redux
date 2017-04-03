import * as React from "react";
import * as classNames from "classnames";
import CheckboxItem from "./CheckboxItem";
import * as Text from "../text/timebomb";

export interface TBSettings {
  enabled: boolean;
  minGuests: number;
  maxGuests: number;
  recurring: boolean;
  sameDomain: boolean;
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
      <label htmlFor="tb-min-guests" className={classNames({
        disabled: !value.enabled
      })}>
        { Text.TimebombMinGuests }
      </label>
      <input id="tb-min-guests" type="number" min="0"
        value={value.minGuests}
        disabled={!value.enabled}
        onChange={(e) => onChange({
          ...value,
          minGuests: parseInt(e.currentTarget.value)
        })} />
    </div>

    <div className="form-row">
      <label htmlFor="tb-max-guests" className={classNames({
        disabled: !value.enabled
      })}>
        { Text.TimebombMaxGuests }
      </label>
      <input id="tb-max-guests" type="number" min="0"
        value={value.maxGuests}
        disabled={!value.enabled}
        onChange={(e) => onChange({
          ...value,
          maxGuests: parseInt(e.currentTarget.value)
        })} />
    </div>

    <CheckboxItem
        checked={value.recurring}
        inputProps={{ disabled: !value.enabled }}
        onChange={(recurring) => onChange({ ...value, recurring })}>
      { Text.RecurringOnly }
    </CheckboxItem>

    <CheckboxItem
        checked={value.sameDomain}
        inputProps={{ disabled: !value.enabled }}
        onChange={(sameDomain) => onChange({ ...value, sameDomain })}>
      { Text.SameDomainOnly }
    </CheckboxItem>
  </div>;
}

export default TimebombSettings;