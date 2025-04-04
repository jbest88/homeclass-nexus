
import React from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIProvider } from "@/hooks/useGenerateLesson";

interface AIModelSelectorProps {
  selectedModel: AIProvider;
  onModelChange: (model: AIProvider) => void;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedModel}
        onValueChange={(value) => onModelChange(value as AIProvider)}
        disabled={true}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Gemini 2.5 Pro (Experimental)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini-2.5-pro-exp-03-25">
            Gemini 2.5 Pro (Experimental)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
