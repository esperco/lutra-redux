/*
  This is the new-group / onboarding page
*/

import * as React from 'react';
import { makeNewGroup } from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import * as Paths from "./paths";
import { LoggedInState, DispatchFn } from './types';
import * as Text from "../text/groups";
import Icon from "../components/Icon";

class Props {
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class Setup extends React.Component<Props, {}> {
  render() {
    return <div id="group-onboarding" className="container">
      <h2>{ Text.GroupOnboardingHeader }</h2>
      { Text.GroupOnboardingDescription }

      <SlideShow />

      <div>
        <button className="primary" onClick={this.start}>
          { Text.GroupOnboardingStart }
        </button>
      </div>
    </div>;
  }

  start = () => {
    makeNewGroup(
      (groupId) => Paths.generalSettings.href({
        groupId, onboarding: true
      }),
      this.props
    );
  }
}

class SlideShow extends React.Component<{}, {page: number}> {
  constructor(props: {}) {
    super(props);

    this.state = {
      page: 1
    };
  }

  render() {
    let page: JSX.Element|undefined;

    switch (this.state.page) {
      case 1:
        page = <div>
          <p>{ Text.TimebombOnboarding1 }</p>
          <img src="/img/Group10.svg" />
        </div>;
        break;
      case 2:
        page = <div>
          <p>{ Text.TimebombOnboarding2 }</p>
          <img src="/img/Group8.svg" />
        </div>;
        break;
      case 3:
        page = <div>
          <p>{ Text.TimebombOnboarding3 }</p>
          <img src="/img/Group9.svg" />
        </div>;
        break;
      default:
        page = undefined;
    }

    return <div className="slide-show container">
      <button className="left-arrow" onClick={() => this.previousPage()}>
        <Icon type="previous" />
      </button>
      {page}
      <button className="right-arrow" onClick={() => this.nextPage()}>
        <Icon type="next" />
      </button>
    </div>;
  }

  previousPage() {
    if (this.state.page > 1 ) {
      this.setState({
        page: this.state.page - 1
      });
    }
  }

  nextPage() {
    if (this.state.page < 3 ) {
      this.setState({
        page: this.state.page + 1
      });
    }
  }
}

export default Setup;
