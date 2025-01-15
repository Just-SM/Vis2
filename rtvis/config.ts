// config.ts
/**
 * config.ts
 * Central place to store configuration constants.
 */

// Single variable controlling how strongly text changes with zoom.
export const ZOOM_SCALE_FACTOR = 3;

// Set these to true/false or numeric values to control text visibility.
export const ENABLE_MIN_MAX = true;
export const MIN_TEXT_SIZE = 3;
export const MAX_TEXT_SIZE = 120;

// Scroll-zoom speed multiplier (how fast you zoom).
export const SCROLL_ZOOM_SPEED = 1.2;

// Zoom offset factor in the 2^(zoom - offset).
export const BASE_ZOOM_OFFSET = 5;

// Initial viewport parameters.
export const INITIAL_VIEW_STATE = {
  longitude: 3.5,
  latitude: 8,
  zoom: 5.5,
  maxZoom: 10,
  pitch: 0,
  bearing: 0,
};
