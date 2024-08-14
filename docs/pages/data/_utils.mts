export function toResponse(data: unknown): { readonly body: string } {
  return { body: JSON.stringify(data) };
}
