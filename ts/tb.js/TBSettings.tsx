import * as React from 'react';
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { State as StoreState, DispatchFn } from './types';

interface Props {
  team: ApiT.Team;
  onboarding?: boolean;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBSettings extends React.Component<Props, {}> {
  render() {
    return <div>{ this.props.onboarding ? "Onboarding" : "Settings" }</div>;
  }
}