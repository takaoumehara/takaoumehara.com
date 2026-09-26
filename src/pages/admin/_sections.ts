// The admin's sections, in nav order. Adding a control later = one entry here
// plus a page at src/pages/admin/<id>.astro that renders inside AdminShell
// (prerender = false; the middleware already guards everything under /admin).
export interface AdminSection {
  id: string;
  href: string;
  label: { en: string; jp: string };
  note: { en: string; jp: string };
}

export const SECTIONS: AdminSection[] = [
  {
    id: "showcase",
    href: "/admin",
    label: { en: "Hero showcase", jp: "トップのスライド" },
    note: {
      en: "Which works the home page's hero shows, in which order, and with which image.",
      jp: "トップページのスライドに出す作品、その順番、使う画像を決めます。",
    },
  },
];
