import { QueryFilter } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { QuerySuggestTask } from "../tasks/suggest-iter";

export function loadSuggestions(props: {
  calgroupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}, deps: {
  postTask: (x: QuerySuggestTask) => any;

  // Promise to wait on before starting
  promise?: Promise<any>;
}): Promise<void> {
  let postTask = () => deps.postTask({
    type: "QUERY_SUGGESTIONS",
    ...props
  });

  if (deps.promise) {
    return deps.promise.then(postTask);
  }

  postTask();
  return Promise.resolve();
}