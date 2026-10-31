// Site-wide settings. Change these values to rebrand or reconfigure the site.
// Anything still in [BRACKETS] is a placeholder that must be filled before launch.
// Run `npm run check:copy` to list the placeholders that remain.

export const site = {
  brand: 'ModelPar',
  wordmark: 'modelpar',
  domain: 'modelpar.com',
  url: 'https://modelpar.com',
  email: 'joe@modelpar.com',

  // Where the teardown form posts. Formspree example: https://formspree.io/f/abcdwxyz
  // Any endpoint that accepts a form POST and returns JSON { ok: true } works.
  formEndpoint: '[FORM_ENDPOINT]',

  city: 'San Diego, CA',
  updated: 'Nov 2026',

  founder: {
    name: 'Joe Waltman',
    role: 'Founder',
    linkedin: 'https://www.linkedin.com/in/joewaltman',
    // Path under /public, e.g. '/joe.jpg'. Leave empty to show the placeholder.
    photo: '/joe-waltman.jpg',
  },

  // Plausible analytics. Loaded only in production builds. No cookies, so no banner.
  analytics: {
    plausibleDomain: 'modelpar.com',
    plausibleSrc: 'https://plausible.io/js/script.js',
  },
} as const;

export const isPlaceholder = (value: string) => /^\[.*\]$/.test(value.trim());
