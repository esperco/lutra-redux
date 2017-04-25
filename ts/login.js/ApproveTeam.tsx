/*
  Modal requiring user approves suspicious teams
*/
import * as React from "react";
import DataStatus from "../components/DataStatus";
import Icon from "../components/Icon";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { GenericErrorMsg } from "../text/error-text";
import * as LoginText from "../text/login";

interface Props {
  team: ApiT.Team;
  profiles: ApiT.Profile[];
  onApprove: () => void;
  onReject: () => void;
  Svcs: ApiSvc;
}

interface State {
  dataStatus?: "busy"|"error";
}

export class ApproveTeam extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return <div>
      <div className="alert warning">
        { LoginText.ApproveTeamsHeading }
      </div>

      <div className="panel">
        { LoginText.ApproveTeamsDescription }

        <div className="panel" style={{textAlign: "left"}}>
          { this.props.team.team_assistants.map(
            (uid) => this.renderProfile(uid)
          ) }
        </div>

        <DataStatus apiCalls={
          this.state.dataStatus === "busy" ? {approve: true} : {}
        } />

        { this.state.dataStatus === "error" ?
          <div className="panel"><div className="alert danger">
            { GenericErrorMsg }
          </div></div> :
          <footer>
            <button className="danger" onClick={this.reject}
                    disabled={!!this.state.dataStatus}>
              { LoginText.Reject }
            </button>
            <button className="success" onClick={this.approve}
                    disabled={!!this.state.dataStatus}>
              { LoginText.Approve }
            </button>
          </footer> }
      </div>
    </div>;
  }

  renderProfile(uid: string) {
    let profile = this.props.profiles.find((p) => p.profile_uid === uid);
    if (profile) {
      return <div className="row" key={uid}>
        <span>
          <Icon type="person" />
          { profile.display_name === profile.email ? profile.email :
            ` ${profile.display_name} (${profile.email})` }
        </span>
      </div>;
    }
    return null;
  }

  approve = () => {
    let teamId = this.props.team.teamid;
    this.setState({ dataStatus: "busy" });
    this.props.Svcs.Api.approveTeam(teamId)
      .then(this.props.onApprove)
      .catch((err) => {
        this.setState({ dataStatus: "error" });
        throw err;
      });
  }

  /*
    TODO: Rather than flat out rejecting, we should just allow removal
    of unauthorized assistants. This is a little complicated because we
    may need to remove the owner of a team *before* we approve the new team.
  */
  reject = () => {
    let teamId = this.props.team.teamid;
    this.setState({ dataStatus: "busy" });

    let msg = `Team ${teamId} rejected. ` +
              `Shenanigans may be afoot. Please investigate.`;
    this.props.Svcs.Api.sendSupportEmail(msg)
      .then(this.props.onReject)
      .catch((err) => {
        this.setState({ dataStatus: "error" });
        throw err;
      });
  }
}

export default ApproveTeam;