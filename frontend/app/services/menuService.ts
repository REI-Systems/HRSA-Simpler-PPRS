/**
 * Service for sidebar menu data.
 */
import { apiGet } from './api';

export type MenuChild = { id: string; label: string; href?: string; header?: boolean };
export type MenuItem = { id: string; label: string; expanded?: boolean; children: MenuChild[] };

/** Default menu when API returns empty (e.g. DB tables not seeded). */
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'general', label: 'General', expanded: false, children: [{ id: 'general-review', label: 'Review', href: '#general-review' }] },
  { id: 'pao', label: 'PAO', expanded: false, children: [{ id: 'pao-review', label: 'Review', href: '#pao-review' }] },
  { id: 'pga', label: 'PGA', children: [{ id: 'pga-review', label: 'Review', href: '#pga-review' }] },
  { id: 'po', label: 'PO', children: [{ id: 'po-review', label: 'Review', href: '#po-review' }] },
  { id: 'pqc', label: 'PQC', children: [{ id: 'pqc-review', label: 'Review', href: '#pqc-review' }] },
  { id: 'ps', label: 'PS', children: [{ id: 'ps-review', label: 'Review', href: '#ps-review' }] },
  { id: 'psvr', label: 'PSVR', children: [{ id: 'psvr-review', label: 'Review', href: '#psvr-review' }] },
  { id: 'site-visit-staff', label: 'Site Visit Staff', children: [{ id: 'site-visit-staff-contribute', label: 'Contribute', href: '#site-visit-staff-contribute' }] },
  {
    id: 'svp',
    label: 'SVP',
    expanded: false,
    children: [
      { id: 'svp-welcome', label: 'Dashboard', href: '/welcome' },
      { id: 'svp-site-visit-plan', label: 'Site Visit Plan', header: true },
      { id: 'svp-prepare', label: 'Prepare', href: '/svp/status' },
      { id: 'svp-initiate', label: 'Initiate', href: '/svp/initiate' },
      { id: 'svp-list', label: 'List', href: '/svp' },
      { id: 'svp-review', label: 'Review', href: '#svp-review' },
    ],
  },
];

export async function getMenu(): Promise<MenuItem[]> {
  try {
    const data = (await apiGet('/api/menu')) as { items?: MenuItem[] };
    const items = data.items ?? [];
    return Array.isArray(items) && items.length > 0 ? items : DEFAULT_MENU_ITEMS;
  } catch {
    return DEFAULT_MENU_ITEMS;
  }
}
