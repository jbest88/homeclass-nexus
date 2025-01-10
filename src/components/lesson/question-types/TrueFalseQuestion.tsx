import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionInputProps } from "@/types/questions";

export const TrueFalseQuestion = ({ value, onChange, disabled }: QuestionInputProps) => {
  return (
    <Select
      value={value as string}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select your answer" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">True</SelectItem>
        <SelectItem value="false">False</SelectItem>
      </SelectContent>
    </Select>
  );
};