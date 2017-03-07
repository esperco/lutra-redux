import * as React from 'react';
import { ApiSvc } from "../lib/api";
import { State as StoreState, DispatchFn } from './types';

interface Props {
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBEventList extends React.Component<Props, {}> {
  render() {
    return <div>Hello World</div>;
  }
}