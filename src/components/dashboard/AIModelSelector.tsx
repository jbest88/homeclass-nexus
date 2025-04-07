
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
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini-1.5-pro">
            Gemini 1.5 Pro
          </SelectItem>
          <SelectItem value="gemini-1.0-pro">
            Gemini 1.0 Pro
          </SelectItem>
          <SelectItem value="gemini-1.5-flash">
            Gemini 1.5 Flash
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
