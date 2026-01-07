import * as React from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

// Import your UI components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";

// --- Components ---

export function FormWrapper<T extends FieldValues>({
  children,
  form,
  onSubmit,
  id,
  className,
}: FormWrapperProps<T>) {
  return (
    <form id={id} onSubmit={form.handleSubmit(onSubmit)} className={className}>
      <FieldGroup className="gap-4">{children}</FieldGroup>
    </form>
  );
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = "text",
  disabled,
  required,
  autoFocus = false,
}: InputProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>
            {label}
            {/* {required && <span className="text-destructive ml-1">*</span>} */}
          </FieldLabel>

          <div className="relative">
            <Input
              {...field}
              type={inputType}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              autoFocus={autoFocus}
              aria-invalid={fieldState.invalid}
              className={isPassword ? "pr-10" : ""}
            />

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle password visibility</span>
              </button>
            )}
          </div>

          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  disabled,
  required,
}: BaseFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>
            {label}
            {/* {required && <span className="text-destructive ml-1">*</span>} */}
          </FieldLabel>
          <Textarea
            {...field}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="resize-none"
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select an option",
  description,
  disabled,
  required,
}: SelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>
            {label}
            {/* {required && <span className="text-destructive ml-1">*</span>} */}
          </FieldLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
            required={required}
          >
            <SelectTrigger aria-invalid={fieldState.invalid}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

// --- Types ---

interface FormWrapperProps<T extends FieldValues> {
  children: React.ReactNode;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void;
  id?: string;
  className?: string;
}

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
}

interface InputProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: "text" | "email" | "password" | "number";
  autoFocus?: boolean;
}

interface SelectProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: { label: string; value: string }[];
}
