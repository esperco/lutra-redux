/*
  Generic Esper not-found page
*/

import * as React from "react";

interface Props {}
interface State {}

class NotFound extends React.Component<Props, State> {
  render() {
    return <div>
      404. Page not found.
    </div>
  }
}

export default NotFound;
