export function toResponse(data: any): { readonly body: string } {
  return { body: JSON.stringify(data) };
}
