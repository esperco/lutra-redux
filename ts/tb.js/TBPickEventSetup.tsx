import * as React from "react";
import Icon from "../components/Icon";
import * as Events from "../handlers/events";
import { Props } from "./TBEvents";
import { GenericPeriod } from "../lib/period";
import * as TBText from "../text/timebomb";
import TBEventsList from "./TBEventList";
import * as Paths from "./paths";

export class TBPickEventSetup extends React.Component<Props, {}> {
  render() {
    return <div className="container onboarding">
      <h2>
        <a href={Paths.calSetup.href({})}>
          <Icon type="previous" />
        </a>
        { TBText.OnboardingPickEventHeading }
      </h2>
      <div className="description">
        { TBText.OnboardingPickEventDescription }
      </div>

      <TBEventsList
        noContentMessage={TBText.onboardingNoContent(Paths.calSetup.href({}))}
        onTimebombToggle={this.timebombToggle}
        onPeriodChange={this.periodChange}
        {...this.props}
      />
    </div>;
  }

  timebombToggle = (eventId: string, value: boolean) => {
    Events.toggleTimebomb({
      calgroupId: this.props.teamId,
      calgroupType: "team",
      eventId,
      value
    }, this.props);

    if (value) {
      this.props.Svcs.Nav.go(Paths.eventDetailsSetup.href({
        eventId, period: this.props.period
      }));
    }
  }

  periodChange = (period: GenericPeriod) => {
    this.props.Svcs.Nav.go(Paths.pickEventSetup.href({ period }));
  }
};

export default TBPickEventSetup;
