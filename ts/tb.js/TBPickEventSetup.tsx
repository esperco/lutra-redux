import * as React from "react";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import * as Events from "../handlers/events";
import { BaseProps } from "./TBEvents";
import * as ApiT from "../lib/apiT";
import { iter } from "../lib/event-query-iter";
import { GenericPeriod } from "../lib/period";
import { hasTag } from "../lib/util";
import { ready } from "../states/data-status";
import * as TBText from "../text/timebomb";
import TBEventsList from "./TBEventList";
import * as Paths from "./paths";

interface Props extends BaseProps {
  eventId?: string;
}

export class TBPickEventSetup extends React.Component<Props, {}> {
  render() {
    let { eventId, children, ...props } = this.props;

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
        {...props}
      />

      <EventModal eventId={eventId} onClose={this.closeModal} {...props} />
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

    this.props.Svcs.Nav.go(Paths.pickEventSetup.href({
      period: this.props.period,
      eventId
    }));
  }

  closeModal = () => {
    this.props.Svcs.Nav.go(Paths.pickEventSetup.href({
      period: this.props.period,
    }));
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

const EventModal = ({ onClose, eventId, teamId, state }: Props & {
  onClose: () => void;
}) => {
  if (! eventId) return null;
  if (! state.login) return null;

  let eventMap = state.events[teamId] || {};
  let event = eventMap[eventId];
  let uid = state.login.uid;

  if (! ready(event)) {
    return null;
  }

  return <Modal header={event.title || ""} onClose={onClose}>
    <div className="panel">
      <TimebombMessage tb={event.timebomb} uid={uid} />

      <div style={{textAlign: "center"}}>
        <a className="cta primary"
           href={Paths.slackSetup.href({})}>
          <span>{ TBText.GoToSlackSetup }</span>
        </a>
      </div>
    </div>
  </Modal>;
}

const TimebombMessage =
  ({ tb, uid } : { tb?: ApiT.TimebombState; uid: string; }) => {
    if (! tb) {
      return TBText.Stage0OffDescription();
    }

    if (hasTag("Stage0", tb)) {
      if (tb[1].set_timebomb) {
        return TBText.Stage0OnDescription(tb[1].set_by);
      } else {
        return TBText.Stage0OffDescription();
      }
    }

    else if (hasTag("Stage1", tb)) {
      let user = tb[1].contributors.find((c) => c.uid === uid);
      if (user && user.contributes) {
        return TBText.Stage1OnDescription(tb[1].confirm_by);
      } else {
        return TBText.Stage1OffDescription(tb[1].confirm_by);
      }
    }

    else if (tb[1] === "Event_confirmed") {
      return TBText.Stage2ConfirmedDescription();
    }

    else {
      return TBText.Stage2CancelledDescription();
    }
  }

export default TBPickEventSetup;
