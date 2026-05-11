declare const __LANE_VERSION__: string | undefined;

export const VERSION: string =
  typeof __LANE_VERSION__ !== "undefined" ? __LANE_VERSION__ : "dev";
