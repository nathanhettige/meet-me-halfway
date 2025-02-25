import { j } from "../jstack";
import autocomplete from "../handlers/maps/autocomplete";
import search from "../handlers/maps/search";

export const mapsRouter = j.router({
  autocomplete,
  search,
});
