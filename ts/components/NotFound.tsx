/*
  Generic Esper not-found page
*/

import * as React from "react";

interface Props {}
interface State {}

class NotFound extends React.Component<Props, State> {
  render() {
    return <div>
      <h2>404</h2>
      <div>Page not found.</div>
    </div>
  }
}

export default NotFound;
