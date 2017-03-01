import * as React from "react";
import Icon from "./Icon";
import * as Text from "../text/timebomb";

const MAX_PAGES = 3;

export class SlideShow extends React.Component<{}, {page: number}> {
  constructor(props: {}) {
    super(props);

    this.state = {
      page: 1
    };
  }

  render() {
    let page: JSX.Element|undefined;

    switch (this.state.page) {
      case 1:
        page = <div>
          <p>{ Text.Onboarding1 }</p>
          <img src="/img/Group10.svg" />
        </div>;
        break;
      case 2:
        page = <div>
          <p>{ Text.Onboarding2 }</p>
          <img src="/img/Group8.svg" />
        </div>;
        break;
      case 3:
        page = <div>
          <p>{ Text.Onboarding3 }</p>
          <img src="/img/Group9.svg" />
        </div>;
        break;
      default:
        page = undefined;
    }

    return <div className="slide-show container">
      <button className="left-arrow"
          disabled={this.state.page <= 1}
          onClick={() => this.previousPage()}>
        <Icon type="previous" />
      </button>
      {page}
      <button className="right-arrow"
          disabled={this.state.page >= MAX_PAGES}
          onClick={() => this.nextPage()}>
        <Icon type="next" />
      </button>
    </div>;
  }

  previousPage() {
    if (this.state.page > 1 ) {
      this.setState({
        page: this.state.page - 1
      });
    }
  }

  nextPage() {
    if (this.state.page < MAX_PAGES ) {
      this.setState({
        page: this.state.page + 1
      });
    }
  }
}

export default SlideShow;