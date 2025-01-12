import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuestionInputProps } from "@/types/questions";

export const MultipleChoiceQuestion = ({ 
  options, 
  value, 
  onChange, 
  disabled,
  question 
}: QuestionInputProps) => {
  return (
    <RadioGroup
      value={value as string || ""}
      onValueChange={onChange}
      className="space-y-2"
      disabled={disabled}
    >
      {options?.map((option, optionIndex) => (
        <div key={optionIndex} className="flex items-center space-x-2">
          <RadioGroupItem 
            value={option} 
            id={`option-${optionIndex}`}
            disabled={disabled}
          />
          <Label 
            htmlFor={`option-${optionIndex}`}
            className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          >
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};