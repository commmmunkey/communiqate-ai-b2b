export interface LoginParams {
  email: string;
  password: string;
}

// Based on your old code's "RegisteredUserData"
export interface UserData {
  userID: string;
  userFirstName: string;
  userLastName: string;
  userSecurityToken: string;
  corporateUserId: string;
  isCorporateuser: string;
  // Add other fields as needed
}

export interface CorporateData {
  companyname: string;
  companylogo: string;
  companybanner: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  accent: string;
}

// The generic response structure based on your old code
export interface LegacyApiResponse<T> {
  status: string;
  message: string;
  data: T[];
}