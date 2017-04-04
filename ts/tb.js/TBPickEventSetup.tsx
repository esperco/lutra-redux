import * as React from "react";
import Icon from "../components/Icon";
import * as Events from "../handlers/events";
import { BaseProps as Props } from "./TBEvents";
import { iter } from "../lib/event-query-iter";
import { GenericPeriod } from "../lib/period";
import { hasTag } from "../lib/util";
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
    let calgroupId = this.props.teamId;
    Events.toggleTimebomb({
      calgroupId,
      calgroupType: "team",
      eventId,
      value
    }, this.props);

    /*
      Implicitly treat all events in this period before this eventId
      as having timebomb off (we assume user would pick first event
      to turn on). This avoids accidental misclassification if user
      defaults timebomb on later.
    */
    iter({ ...this.props, calgroupId, query: {} }, this.props.state, (e) => {
      if (e.id === eventId) return false;
      if (e.timebomb && hasTag("Stage0", e.timebomb)) {
        Events.toggleTimebomb({
          calgroupId,
          calgroupType: "team",
          eventId: e.id,
          value: e.timebomb[1].set_timebomb
        }, this.props);
      }
      return true;
    });

    if (value) {
      this.props.Svcs.Nav.go(Paths.eventDetailsSetup.href({
        eventId, period: this.props.period
      }));
    }
  }

  periodChange = (period: GenericPeriod) => {
    this.props.Svcs.Nav.go(Paths.pickEventSetup.href({ period }));

    // Implicit confirmation of all earlier events
    let calgroupId = this.props.teamId;
    iter({ ...this.props, calgroupId, query: {} }, this.props.state, (e) => {
      if (e.timebomb && hasTag("Stage0", e.timebomb)) {
        Events.toggleTimebomb({
          calgroupId,
          calgroupType: "team",
          eventId: e.id,
          value: e.timebomb[1].set_timebomb
        }, this.props);
      }
    });
  }
};

export default TBPickEventSetup;
