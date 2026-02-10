export interface ApiError extends Error {
  status?: number;
  detail?: string;
  incomplete_sections?: string[];
  isNetworkError?: boolean;
}

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export type NavItemWithHeader = NavItem & { header?: boolean };

export type UserLink = {
  id: string;
  label: string | null;
  href: string;
  hasDropdown?: boolean;
};

export type LayoutContextValue = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  sidebarPinned: boolean;
  setSidebarPinned: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  toggleSidebarPin: () => void;
  user: string;
  setUser: (value: string | ((prev: string) => string)) => void;
  displayDateTime: string;
  lastLogin: string;
};

export type StoredUser = {
  id?: string;
  username?: string;
  email?: string;
};
