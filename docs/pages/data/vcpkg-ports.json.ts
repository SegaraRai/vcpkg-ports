import type { APIRoute } from "astro";
import data from '../../virtual/dataVcpkgPorts.mjs';
import { toResponse } from './_utils.mjs';

export const GET: APIRoute = () => toResponse(data);
