export interface ProfileInterface {
  userId: any;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  email: string | null | undefined;
  emailVerified: boolean;
  walletBalance: number;
  phoneNumber: string | null | undefined;
  role: string;
  state: string | null | undefined;
  city: string | null | undefined;
  country: string | null | undefined;
  picture: string | null | undefined;
  street: string | null | undefined;
  bio:string|null|undefined;
}
