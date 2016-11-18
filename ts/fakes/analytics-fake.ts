import { AnalyticsSvc } from "../lib/analytics";

function analyticsFakeFactory() {
  let svc: AnalyticsSvc = {
    Analytics: {
      track: () => null,
      page: () => null,
      identify: () => null,
      reset: () => null,
      disabled: false
    }
  };
  return svc;
}

export default analyticsFakeFactory;
