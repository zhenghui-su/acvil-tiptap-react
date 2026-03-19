const palette = ["#2563eb", "#dc2626", "#059669", "#9333ea", "#ea580c", "#0891b2"] as const;

const names = ["流云", "山岚", "星河", "青禾", "远舟", "望舒"] as const;

export interface DemoUser {
  color: string;
  name: string;
}

function createRandomUser(): DemoUser {
  const index = Math.floor(Math.random() * names.length);
  const suffix = Math.floor(Math.random() * 90 + 10);

  return {
    color: palette[index % palette.length],
    name: `${names[index]} ${suffix}`,
  };
}

export function getStableDemoUser(storageKey: string): DemoUser {
  if (typeof window === "undefined") {
    return createRandomUser();
  }

  const cached = window.sessionStorage.getItem(storageKey);

  if (cached) {
    return JSON.parse(cached) as DemoUser;
  }

  const nextUser = createRandomUser();

  window.sessionStorage.setItem(storageKey, JSON.stringify(nextUser));

  return nextUser;
}
