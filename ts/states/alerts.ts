/*
  Error state -- used for showing an error message to the user
*/
import * as _ from "lodash";
export type AlertType = "GO_TO_GROUPS";

export interface AlertState {
  alerts: AlertType[];
}

export interface AddAction {
  type: "ADD_ALERT";
  alert: AlertType;
}

export interface RemoveAction {
  type: "REMOVE_ALERT";
  alert: AlertType;
}

export type Action = AddAction|RemoveAction;

export function alertReducer<S extends AlertState>(
  state: S, action: Action
) {
  let { alerts } = state;
  let { alert } = action;

  let indexOfCurrent = _.findIndex(alerts, (a) => _.isEqual(a, alert));
  if (action.type === "ADD_ALERT" && indexOfCurrent < 0) {
    alerts = [...alerts, alert];
  }

  else if (action.type === "REMOVE_ALERT" && indexOfCurrent >= 0) {
    alerts = _.clone(alerts);
    alerts.splice(indexOfCurrent, 1);
  }

  return _.extend({}, state, { alerts });
}

export function initState(): AlertState {
  return { alerts: [] };
}