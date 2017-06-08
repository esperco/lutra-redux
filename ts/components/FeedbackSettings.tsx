/*
  The Feedback analogue of timebomb settings. Separate component (even though
  code is very simialr to timebomb) for easy of differentiating later.
*/

import * as React from "react";
import * as classNames from "classnames";
import CheckboxItem from "./CheckboxItem";
import * as Text from "../text/feedback";

export interface FBSettings {
  enabled: boolean;
  minGuests: number;
  maxGuests: number;
  recurring: boolean;
  sameDomain: boolean;
}

interface Props {
  value: FBSettings;
  onChange: (val: FBSettings) => any;
}

export const FeedbackSettings = ({ value, onChange } : Props) => {
  return <div>
    <CheckboxItem
        checked={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}>
      { Text.FeedbackDefault }
    </CheckboxItem>

    <div className="form-row">
      <label htmlFor="tb-min-guests" className={classNames({
        disabled: !value.enabled
      })}>
        { Text.MinGuests }
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
        { Text.MaxGuests }
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

export default FeedbackSettings;