import data from '../../virtual/dataVcpkgPorts.mjs';
import { toResponse } from './_utils.mjs';

const response = toResponse(data);

export const get = () => ({ ...response });
