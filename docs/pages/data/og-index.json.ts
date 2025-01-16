import type { APIRoute } from "astro";
import data from '../../virtual/dataOGIndex.mjs';
import { toResponse } from './_utils.mjs';

export const GET: APIRoute = () => toResponse(data);
