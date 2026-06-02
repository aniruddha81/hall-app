export const queryKeys = {
  dining: {
    all: ['dining'] as const,
    tomorrowMenus: () => [...queryKeys.dining.all, 'tomorrow-menus'] as const,
    activeTokens: () => [...queryKeys.dining.all, 'active-tokens'] as const,
  },
  student: {
    all: ['student'] as const,
    dues: () => [...queryKeys.student.all, 'dues'] as const,
    application: () => [...queryKeys.student.all, 'application'] as const,
  },
};
