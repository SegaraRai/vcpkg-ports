import data from '../../virtual/dataOGIndex.mjs';
import { toResponse } from './_utils.mjs';

const response = toResponse(data);

export const get = () => ({ ...response });
