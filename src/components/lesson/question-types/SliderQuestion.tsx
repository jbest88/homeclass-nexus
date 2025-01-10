import { Slider } from "@/components/ui/slider";
import { QuestionInputProps } from "@/types/questions";

export const SliderQuestion = ({ value, onChange, disabled, min = 0, max = 100, step = 1 }: QuestionInputProps) => {
  return (
    <div className="space-y-4">
      <Slider
        value={[Number(value) || min]}
        onValueChange={(values) => onChange(String(values[0]))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <div className="text-sm text-muted-foreground text-center">
        Selected value: {value || min}
      </div>
    </div>
  );
};