import { Input } from "@/components/ui/input";
import { QuestionInputProps } from "@/types/questions";

export const TextQuestion = ({ value, onChange, disabled }: QuestionInputProps) => {
  return (
    <Input
      placeholder="Type your answer here..."
      value={value as string || ""}
      onChange={(e) => onChange(e.target.value)}
      className="mb-2"
      disabled={disabled}
    />
  );
};