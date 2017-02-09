import * as moment from "moment";
import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State, PostTaskFn } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import { QueryFilter, reduce } from "../lib/event-queries";
import { GenericPeriod, fromDates } from "../lib/period";
import * as Calcs from "../handlers/group-calcs";
import * as Events from "../handlers/group-events";
import * as Select from "../handlers/events-select";
import * as InviteEmails from "../handlers/invite-emails";
import * as Suggestions from "../handlers/group-suggestions";
import * as Groups from "../handlers/groups"
import * as TeamCals from "../handlers/team-cals";
import { compactObject } from "../lib/util";

interface Deps {
  dispatch: (action: Action) => any,
  state: State,
  postTask: PostTaskFn,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}

export interface EventListRoute {
  page: "GroupEvents";
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  query: QueryFilter;
  period: GenericPeriod;
};

export function goToSetup(Svcs: Routing.NavSvc) {
  Svcs.Nav.go(Paths.setup.href({}));
}

export const eventList = Paths.eventList.route<Deps>(function(p, deps) {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    // Default period = today + 6 (7 days total)
    let period = p.period || fromDates(
      new Date(),
      moment(new Date()).add(6, 'days').toDate()
    );

    let query: QueryFilter = reduce({
      labels: p.labels,
      contains: p.contains,
      participant: p.participant,
      minCost: p.minCost
    });

    let props = { groupId, period, query };
    let p1 = Groups.fetch(groupId,
      { withLabels: true, withMembers: true }, deps);
    let p2 = Events.fetchGroupEvents(props, deps);
    let promise = Promise.all([p1, p2]);
    Calcs.startGroupCalc(props, { ...deps, promise });
    Suggestions.loadSuggestions(props, { ...deps, promise });

    // Toggle selection based on URL - select without eventId => select all
    if (p.selectMode === true && !p.eventId) {
      Select.selectAll(props, deps);
    }

    // Select with event ID => select one
    else if (p.eventId) {
      Select.toggleEventId({
        groupId,
        clear: typeof p.selectMode === 'undefined',
        eventId: p.eventId,
        value: typeof p.selectMode === 'undefined' ? true : p.selectMode
      }, deps);
    }

    else {
      Select.clearAll(groupId, deps);
    }

    // Dispatch route changes
    deps.dispatch({
      type: "ROUTE",
      route: compactObject({
        page: "GroupEvents" as "GroupEvents",
        groupId: groupId,
        showFilters: p.showFilters,
        eventId: p.eventId || undefined,
        query, period
      })
    });
  } else {
    goToSetup(deps.Svcs);
  }
});

export interface SetupRoute { page: "Setup" };
export const setup = Paths.setup.route<Deps>(function(p, deps) {
  deps.dispatch({
    type: "ROUTE",
    route: { page: "Setup" }
  });
});

// Doesn't do anything -- just redirect to general settings
export const settings = Paths.settings.route<Deps>(function(p, deps) {
  deps.Svcs.Nav.go(Paths.generalSettings.href(p));
});

// Group info + member list
export interface GeneralSettingsRoute {
  page: "GroupGeneralSettings";
  groupId: string;
  editTeamId?: string;
  onboarding?: boolean;
}

export const generalSettings = Paths.generalSettings.route<Deps>((p, deps) => {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    Groups.fetch(groupId, { withMembers: true }, deps);
    if (p.editTeamId) {
      TeamCals.fetchAvailableCalendars(p.editTeamId, deps);
      TeamCals.fetchSelectedCalendars(p.editTeamId, deps);
    }
    InviteEmails.fetch(deps);

    deps.dispatch({
      type: "ROUTE",
      route: {
        page: "GroupGeneralSettings",
        groupId,
        editTeamId: p.editTeamId,
        onboarding: p.onboarding
      }
    })
  }

  else {
    goToSetup(deps.Svcs);
  }
});


// Label management
export interface LabelSettingsRoute {
  page: "GroupLabelSettings";
  groupId: string;
}

export const labelSettings = Paths.labelSettings.route<Deps>((p, deps) => {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    Groups.fetch(groupId, { withLabels: true }, deps);
    deps.dispatch({
      type: "ROUTE",
      route: {
        page: "GroupLabelSettings",
        groupId
      }
    });
  }

  else {
    goToSetup(deps.Svcs);
  }
});


// Notification preferences
export interface NotificationSettingsRoute {
  page: "GroupNotificationSettings";
  groupId: string;
}

export const notificationSettings = Paths.notificationSettings.route<Deps>(
(p, deps) => {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    Groups.fetchPreferences(groupId, deps);
    deps.dispatch({
      type: "ROUTE",
      route: {
        page: "GroupNotificationSettings",
        groupId
      }
    });
  }

  else {
    goToSetup(deps.Svcs);
  }
});


// Miscellaneous group settings (like delete group)
export interface MiscSettingsRoute {
  page: "GroupMiscSettings";
  groupId: string;
}

export const miscSettings = Paths.miscSettings.route<Deps>(
(p, deps) => {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    deps.dispatch({
      type: "ROUTE",
      route: {
        page: "GroupMiscSettings",
        groupId
      }
    });
  }

  else {
    goToSetup(deps.Svcs);
  }
});


export type RouteTypes =
  EventListRoute|
  SetupRoute|
  GeneralSettingsRoute|
  LabelSettingsRoute|
  NotificationSettingsRoute|
  MiscSettingsRoute;

export function init({ dispatch, getState, postTask, Svcs, Conf }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  postTask: PostTaskFn,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}) {
  Routing.init<Deps>(
    [ // Routes
      eventList,
      setup,
      settings,
      generalSettings,
      labelSettings,
      notificationSettings,
      miscSettings
    ],

    // Deps
    () => ({ dispatch, state: getState(), postTask, Svcs, Conf }),

    // Opts
    { home: () => Paths.eventList.href({
      groupId: "default",
      eventId: ""
    }) }
  );
}
