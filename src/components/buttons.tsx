import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// --- Components ---

export function LoadingButton({
    children,
    loading,
    className,
    disabled,
    ...props
}: LoadingButtonProps) {
    return (
        <Button
            disabled={loading || disabled}
            className={cn("relative", className)}
            {...props}
        >
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </div>
            )}

            <span className={loading ? "opacity-0" : ""}>{children}</span>
        </Button>
    )
}

// --- Types ---

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
    loading?: boolean
}