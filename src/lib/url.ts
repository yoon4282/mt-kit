export const defaultBaseUrl = () => `${location.origin}${location.pathname}`;

export function readParams() {
  const q = new URLSearchParams(location.search);
  return {
    role: q.get('role'),
    room: (q.get('room') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6),
    key: q.get('key') ?? undefined,
  };
}
