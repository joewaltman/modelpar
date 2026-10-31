import type { APIRoute } from 'astro';
import { site } from '../../config';

// RFC 9116. Expires is set about 11 months after each build; the weekly
// price-check commit triggers a rebuild, which keeps it current.
export const GET: APIRoute = () => {
  const expires = new Date(Date.now() + 330 * 24 * 60 * 60 * 1000);
  expires.setUTCHours(0, 0, 0, 0);
  const body = [
    `Contact: mailto:${site.email}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${new URL('/.well-known/security.txt', site.url)}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
