import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { loginApi, 
  // getCorporateData 
  } from './service';
import type { LoginParams } from './types';

export const useLogin = (onAuthChange: () => void) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (creds: LoginParams) => {
      const user = await loginApi(creds);

      // const corporate = await getCorporateData(user.userID);

      return { user
        // , corporate
       };
    },
    onSuccess: ({ user
      // , corporate
     }) => {
      // --- Save User Data ---
      localStorage.setItem('TOKEN_ID', user.userSecurityToken);
      localStorage.setItem('USER_ID', user.userID);
      localStorage.setItem('corporateUserId', user.corporateUserId);
      localStorage.setItem('USER_NAME', `${user.userFirstName} ${user.userLastName}`);
      localStorage.setItem('USER_DATA', JSON.stringify(user));

      // --- Save Corporate Data ---
      // localStorage.setItem('corporate_companyname', corporate.companyname);
      // localStorage.setItem('corporate_companylogo', `https://stage.englishmonkapp.com/englishmonk-staging//backend/web/uploads/users/${corporate.companylogo}`); // Ideally move base URL to env
      // localStorage.setItem('corporate_primary_color', corporate.primary_color);
      // ... save other colors as needed

      // Notify App.tsx that the token is now available
      onAuthChange();

      // --- Redirect ---
      navigate('/'); 
    },
    onError: (error) => {
      console.error("Login Sequence Failed:", error);
    }
  });
};