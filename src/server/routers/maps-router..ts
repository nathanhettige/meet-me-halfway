import { j } from "../jstack";
import autocomplete from "../handlers/maps/autocomplete";
import find from "../handlers/maps/find";

export const mapsRouter = j.router({
  autocomplete,
  find,
});
