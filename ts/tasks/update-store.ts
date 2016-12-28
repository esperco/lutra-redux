/*
  A worker task that updates the worker's copy of a Redux store based on
  a dispatch action.
*/
export interface UpdateStoreTask<A> {
  type: "UPDATE_STORE";
  dispatch: A;
};
