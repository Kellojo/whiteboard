import { writable } from "svelte/store";
import { Board } from "./domain/Board";

export interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export const board = writable(new Board());
export const selectedElementIds = writable<Set<string>>(new Set());
export const viewport = writable<ViewportState>({
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
});
