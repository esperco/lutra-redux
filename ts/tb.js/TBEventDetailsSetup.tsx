
import * as _ from "lodash";
import * as React from "react";
import CheckboxItem from "../components/CheckboxItem";
import { EventInfo } from "../components/EventList";
import Icon from "../components/Icon";
import TimebombToggle from "../components/TimebombToggle";
import * as Events from "../handlers/events";
import * as TeamPrefs from "../handlers/team-prefs";
import * as ApiT from "../lib/apiT";
import { GenericPeriod } from "../lib/period";
import { hasTag } from "../lib/util";
import { ready } from "../states/data-status";
import * as Paths from "./paths";
import { Props as SettingsProps } from "./TBSettings";
import { FinishOnboarding } from "../text/common";
import * as Text from "../text/timebomb";

interface Props extends SettingsProps {
  eventId: string;
  period?: GenericPeriod; // For back button
}

export const TBEventDetailsSetup = (props: Props) => {
  let eventMap = props.state.events[props.teamId] || {};
  let event = eventMap[props.eventId];

  return <div className="container">
    { ready(event) ?
      <EventDetails {...props} event={event} /> :
      <div className="spinner" /> }

    <TimebombDefault {...props} />
  </div>;
};


interface EventDetailsProps extends Props {
  event: ApiT.GenericCalendarEvent
}

const EventDetails = (props: EventDetailsProps) => {
  let { event, period } = props;
  let { uid } = props.state.login;
  return <div className="onboarding">
    <h2>
      <a href={Paths.pickEventSetup.href({ period })}>
        <Icon type="previous" />
      </a>
      { event.title }
    </h2>
    <EventInfo event={event} includeDay={true} />
    <div className="flex">
      <TimebombMessage tb={event.timebomb} uid={uid} />
      <TimebombToggle
        event={event}
        loggedInUid={uid}
        onToggle={(eventId, value) => Events.toggleTimebomb({
          calgroupId: props.teamId,
          calgroupType: "team",
          eventId, value
        }, props)}
      />
    </div>
  </div>;
};

const TimebombMessage =
  ({ tb, uid } : { tb?: ApiT.TimebombState; uid: string; }) => {
    if (! tb) {
      return Text.Stage0OffDescription();
    }

    if (hasTag("Stage0", tb)) {
      if (tb[1].set_timebomb) {
        return Text.Stage0OnDescription(tb[1].set_by);
      } else {
        return Text.Stage0OffDescription();
      }
    }

    else if (hasTag("Stage1", tb)) {
      if (_.includes(tb[1].confirmed_list, uid)) {
        return Text.Stage1OnDescription(tb[1].confirm_by);
      } else {
        return Text.Stage1OffDescription(tb[1].confirm_by);
      }
    }

    else if (tb[1] === "Event_confirmed") {
      return Text.Stage2ConfirmedDescription();
    }

    else {
      return Text.Stage2CancelledDescription();
    }
  }


export class TimebombDefault extends React.Component<Props, {}> {
  _ref: CheckboxItem;

  render() {
    let prefs = this.props.state.teamPreferences[this.props.teamId];
    return <div className="onboarding-footer">
      <CheckboxItem
        ref={(c) => this._ref = c}
        onChange={() => null}
        defaultChecked={true}>
        <span>{ Text.TimebombDefault }</span>

        { ready(prefs) ? <Text.TimebombDefaultDescription
          settingsHref={Paths.settings.href({})}
          minGuests={prefs.tb_guests_min}
          maxGuests={prefs.tb_guests_max}
        /> : <div className="placeholder" /> }

      </CheckboxItem>

      <button className="primary" onClick={this.done}>
        { FinishOnboarding }
      </button>
    </div>;
  }

  done = () => {
    if (this._ref) {
      let tb = !!this._ref.val();
      TeamPrefs.update(this.props.teamId, { tb }, this.props);
    }
    this.props.Svcs.Nav.go(Paths.events.href({
      period: this.props.period
    }));
  }
}


export default TBEventDetailsSetup;