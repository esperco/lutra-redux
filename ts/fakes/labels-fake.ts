// Helpers for label testing
import * as ApiT from "../lib/apiT";
import { normalize } from "../lib/event-labels";

export function testLabel(original: string): ApiT.LabelInfo {
  return {
    original,
    normalized: normalize(original),
    color: "#123456" // Generic color for testing
  };
}