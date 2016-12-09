/*
  Misc paths that don't go anywhere else
*/
import { Path, StringParam } from "../lib/routing";

let base = "/manage";

export const Home = new Path({ base });

export const Personal = new Path({
  base,
  hash: ["personal"]
});

export const Sandbox = new Path({
  base,
  hash: ["sandbox"]
});

export const NewTeam = new Path({
  base,
  hash: ["new-team"]
});

export const NewCustomer = new Path({
  base,
  hash: ["new-customer"]
});

export const NewGroup = new Path({
  base,
  hash: ["new-group"]
});

export namespace Team {
  let subprefix = "team";
  let params = { teamId: StringParam };

  export const General = new Path({
    base, params,
    hash: [subprefix, "general", ":teamId"]
  });

  export const Labels = new Path({
    base, params,
    hash: [subprefix, "labels", ":teamId"]
  });

  export const Calendars = new Path({
    base, params,
    hash: [subprefix, "calendars", ":teamId"]
  });

  export const Notifications = new Path({
    base, params,
    hash: [subprefix, "notifications", ":teamId"]
  });

  export const Pay = new Path({
    base, params,
    hash: [subprefix, "pay", ":teamId"]
  });

  export const ExportCSV = new Path({
    base, params,
    hash: [subprefix, "export", ":teamId"]
  });
}

export namespace Group {
  let subprefix = "group";
  let params = { groupId: StringParam };

  export const General = new Path({
    base, params,
    hash: [subprefix, "general", ":groupId"]
  });

  export const Labels = new Path({
    base, params,
    hash: [subprefix, "labels", ":groupId"]
  });

  export const Notifications = new Path({
    base, params,
    hash: [subprefix, "notifications", ":groupId"]
  });
};

export namespace Customer {
  let subprefix = "customer";
  let params = { cusId: StringParam };

  export const General = new Path({
    base, params,
    hash: [subprefix, "general", ":cusId"]
  });

  export const Accounts = new Path({
    base, params,
    hash: [subprefix, "accounts", ":cusId"]
  });

  export const Pay = new Path({
    base, params,
    hash: [subprefix, "pay", ":cusId"]
  });
};
