import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { QuestionInputProps } from "@/types/questions";

export const MultipleAnswerQuestion = ({ 
  options, 
  value, 
  onChange, 
  disabled 
}: QuestionInputProps) => {
  const handleChange = (option: string, checked: boolean) => {
    const currentAnswers = (value as string[]) || [];
    let newAnswers: string[];
    
    if (checked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter(answer => answer !== option);
    }

    onChange(newAnswers);
  };

  return (
    <div className="space-y-2">
      {options?.map((option, optionIndex) => {
        const currentAnswers = (value as string[]) || [];
        return (
          <div key={optionIndex} className="flex items-center space-x-2">
            <Checkbox
              id={`option-${optionIndex}`}
              checked={currentAnswers.includes(option)}
              onCheckedChange={(checked) => 
                handleChange(option, checked as boolean)
              }
              disabled={disabled}
            />
            <Label htmlFor={`option-${optionIndex}`}>{option}</Label>
          </div>
        );
      })}
    </div>
  );
};