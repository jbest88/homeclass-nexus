
import React from "react";
import { Settings } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AIProvider } from "@/hooks/useGenerateLesson";

interface AIModelSelectorProps {
  selectedModel: AIProvider;
  onModelChange: (model: AIProvider) => void;
  showApiKeyInput: boolean;
  setShowApiKeyInput: (show: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  showApiKeyInput,
  setShowApiKeyInput,
  apiKey,
  setApiKey
}) => {
  const modelOptions = [
    { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro (Google)" },
    { value: "openai", label: "OpenAI" },
    { value: "deepseek", label: "DeepSeek" },
  ];

  const getProviderLabel = (provider: AIProvider) => {
    return modelOptions.find(option => option.value === provider)?.label || provider;
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedModel}
        onValueChange={(value) => onModelChange(value as AIProvider)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Model" />
        </SelectTrigger>
        <SelectContent>
          {modelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-4" align="end">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                API Key for {getProviderLabel(selectedModel)}
              </Label>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="Enter API key"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The API key is only used for this session and not stored.
              </p>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
