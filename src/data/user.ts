export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  plan: {
    name: string;
    dailyMinutes: number;
    usedMinutesToday: number;
  };
}

export const currentUser: UserProfile = {
  firstName: 'Deon',
  lastName: 'Mensah',
  email: 'deon@example.com',
  phone: '+44 7700 900123',
  plan: {
    name: 'Free plan',
    dailyMinutes: 10,
    usedMinutesToday: 5,
  },
};
