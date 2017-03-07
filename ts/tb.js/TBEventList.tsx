import * as React from 'react';
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { State as StoreState, DispatchFn } from './types';

interface Props {
  team: ApiT.Team;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBEventList extends React.Component<Props, {}> {
  render() {
    return <div>Hello { this.props.team.team_name }</div>;
  }
}