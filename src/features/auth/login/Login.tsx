
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormInput, FormWrapper } from "@/components/form"
import { LoadingButton } from "@/components/buttons"
import { useLogin } from "./useLogin"

function Login({ onAuthChange }: { onAuthChange: () => void }) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues
    })

    const { mutate: login, isPending, error } = useLogin(onAuthChange);

    function onSubmit(data: z.infer<typeof formSchema>) {
        login(data);
    }

    return (
        <FormWrapper form={form} onSubmit={onSubmit} id="login-form" className="gap-4">
            <FormInput control={form.control} required name="email" label="Email" placeholder="Enter your email" type="email" />
            <FormInput control={form.control} required name="password" label="Password" placeholder="Enter your password" type="password" />
            <LoadingButton type="submit" loading={isPending}>
                Login
            </LoadingButton>
            {error && (
                <div className="text-red-500 text-sm text-center">
                    {error.message}
                </div>
            )}
        </FormWrapper>
    )
}

export default Login

const defaultValues = { email: "", password: "" }

const formSchema = z.object({
    email: z
        .string()
        .min(5, "Email must be at least 5 characters.")
        .max(32, "Email must be at most 32 characters."),
    password: z.string().min(8, "Password must be at least 8 characters."),
})