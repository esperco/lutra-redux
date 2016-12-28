import { QueryFilter } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { CalcStartAction } from "../states/group-calcs";
import { QueryCalcTask } from "../tasks/group-query-calc"

export function startGroupCalc(props: {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}, deps: {
  dispatch: (a: CalcStartAction) => any;
  postTask: (x: QueryCalcTask) => any;

  // Promise to wait on before starting
  promise?: Promise<any>;
}): Promise<void> {
  deps.dispatch({
    type: "GROUP_CALC_START",
    ...props
  });

  let postTask = () => deps.postTask({
    type: "GROUP_QUERY_CALC",
    ...props
  });

  if (deps.promise) {
    return deps.promise.then(postTask);
  }

  postTask();
  return Promise.resolve<void>();
}