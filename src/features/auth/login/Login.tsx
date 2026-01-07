import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormInput, FormWrapper } from "@/components/form";
import { LoadingButton } from "@/components/buttons";
import { useLogin } from "./useLogin";
import logo_splash_login from "@/assets/new_logo_splash_login.png";

function Login({ onAuthChange }: { onAuthChange: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { mutate: login, isPending, error } = useLogin(onAuthChange);

  function onSubmit(data: z.infer<typeof formSchema>) {
    login(data);
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-dvh bg-gray-100">
      <img src={logo_splash_login} alt="Logo" className="h-24 w-auto" />
      <div className="flex flex-row items-center space-x-1 mb-5">
        <span className="text-base">{"Welcome Back to Your"}</span>
        <span className="text-base font-bold text-[#F3812F]">
          {" "}
          {"Career Success Portal"}
        </span>
      </div>
      <FormWrapper
        form={form}
        onSubmit={onSubmit}
        id="login-form"
        className="gap-4 w-[min(100%,20rem)] rounded-lg p-4 shadow-md"
      >
        <FormInput
          control={form.control}
          required
          name="email"
          label="Email"
          placeholder="Enter your email"
          type="email"
          autoFocus
        />
        <FormInput
          control={form.control}
          required
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
        />
        <LoadingButton
          type="submit"
          loading={isPending}
          className="w-max mx-auto block hover:bg-[#f5914a] bg-[#F3812F]"
        >
          Sign In
        </LoadingButton>
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error.message}
          </div>
        )}
      </FormWrapper>
    </section>
  );
}

export default Login;

const defaultValues = { email: "", password: "" };

const formSchema = z.object({
  email: z
    .string()
    .min(5, "Email must be at least 5 characters.")
    .max(32, "Email must be at most 32 characters."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
