/*
  Converts API error variants into typed literals
*/

import * as _ from "lodash";

/*
  Type of variants (tagged unions) using atdgen's convention.

  If no value is associated with the tag, the JSON representation is just
  a string.

  If a value is associated with the tag, the representation is
  [tag, value] where value has its own type specific to the tag.
*/
type Variant = string | [string, any];

/*
  Union types of different tag/value combos -- we use objects with string
  literals instead of the tagged arrays returned by Wolverine because
  TypeScript is much better with inferring types with objects (and because
  it's more robust for an error object to not have a value than the type
  to differ between sometimes being a string and sometimes being a 2-tuple

  List below is incomplete but that's fine. We add an "DEFAULT" literal to the
  mix so we can reliably check other tag results and get correct value info.
*/
export type ErrorDetails = {
  /*
    Lump all the value-less tags together since there's nothing extra
    to infer from those literal values other than the lack of a value
  */
  tag: "Stripe_canceled_subscription"|
       "Missing_payment_source"|
       "Payment_required"|
       "Wrong_customer_type"|
       "Cannot_remove_last_group_owner"|
       "Invalid_authentication_headers"|
       "Missing_authentication_headers"|
       "Expired_link"|
       "Invalid_token"|
       "Expired_token"|
       "DEFAULT" // Default exists so we can exhaustively check all known tags
                 // and not have TypeScript assume all cases have been checked
}|{
  tag: "Login_required",
  value: {
    uid: string;
    email: string;
  }
};

export function errorDetail(variant: Variant): ErrorDetails {
  if (_.isString(variant)) {
    return { tag: variant } as ErrorDetails;
  } else {
    let [tag, value] = variant;
    return { tag, value } as ErrorDetails;
  }
}
