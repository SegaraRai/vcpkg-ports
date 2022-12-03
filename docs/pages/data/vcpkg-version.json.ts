import data from '../../virtual/dataVcpkgVersion.mjs';
import { toResponse } from './_utils.mjs';

const response = toResponse(data);

export const get = () => ({ ...response });
