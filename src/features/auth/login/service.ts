import apiClient from '@/lib/axios';
import type { LoginParams, UserData, CorporateData, LegacyApiResponse } from './types.ts';

const createLegacyBody = (data: any) => {
  const jsonString = JSON.stringify([data]);
  return `json=${jsonString}`;
};

export const loginApi = async ({ email, password }: LoginParams): Promise<UserData> => {
  const payload = {
    userMobile: email,
    userPassword: password,
    languageID: "1",
    userDeviceID: " ",
    userCountryCode: "",
    apiType: "Android",
    apiVersion: "1.0"
  };

  const response = await apiClient.post<LegacyApiResponse<UserData>[]>(
    '/users/user-login-otp', 
    createLegacyBody(payload),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  const result = response.data[0];

  if (result.status === 'false') {
    throw new Error(result.message || 'Login failed');
  }

  const userData = result.data[0];

  if (userData.isCorporateuser === "No") {
    throw new Error("Access Restricted: This portal is exclusively for corporate clients.");
  }

  return userData;
};

export const getCorporateData = async (userId: string): Promise<CorporateData> => {
  const payload = {
    loginuserID: userId,
    languageID: "1",
    apiType: "Android",
    apiVersion: "1.0"
  };

  const response = await apiClient.post<LegacyApiResponse<CorporateData>[]>(
    '/corporate/corporate-user-info',
    createLegacyBody(payload),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  const result = response.data[0];
  if (result.status === 'false') throw new Error(result.message);

  return result.data[0];
};