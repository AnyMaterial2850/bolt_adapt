export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  HABITS: '/habits',
  HABIT_DETAIL: (id: string) => `/habits/${id}`,
  ADMIN_HABITS: '/admin/habits',
  SETTINGS: '/settings',
  EDIT_GOAL: '/edit-goal',
  EDIT_WHY: '/edit-why',
} as const;