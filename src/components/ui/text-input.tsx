import { cn } from "@/lib/utils";
import { inputBaseClasses } from "@/components/ui/input";

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        inputBaseClasses(false),
        className
      )}
      {...props}
    />
  );
}
