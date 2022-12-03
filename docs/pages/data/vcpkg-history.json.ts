import data from '../../virtual/dataVcpkgHistory.mjs';
import { toResponse } from './_utils.mjs';

const response = toResponse(data);

export const get = () => ({ ...response });
