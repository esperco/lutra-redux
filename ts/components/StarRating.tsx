/*
  Input for selecting 1-5 stars
*/
require("less/components/_star-rating.less");
import * as _ from "lodash";
import * as React from "react";

const DEFAULT_MAX_STARS = 5;

export interface Props {
  value?: number|null;
  onChange: (n: number) => void;
  maxStars?: number; // Default = 5
  disabled?: boolean;
}

interface State {
  value?: number; // Based on hovering
}

export class StarRating extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    let value = this.state.value || this.props.value || 0;
    let { disabled } = this.props;
    return <div className="star-rating">
      <div className="stars">
        { _.times(this.props.maxStars || DEFAULT_MAX_STARS,
          (n) => <button key={n}
            disabled={disabled}
            onClick={() => this.props.onChange(n + 1)}
            onMouseEnter={() => this.setState({ value: n + 1 })}
            onMouseLeave={() => this.setState({ value: undefined })}
          >
            { !disabled && value > n ?
              <span>&#x2605;</span> :
              <span>&#x2606;</span> }
          </button>) }
      </div>
    </div>;
  }
}

export default StarRating;