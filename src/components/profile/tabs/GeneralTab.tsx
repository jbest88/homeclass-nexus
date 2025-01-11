import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface GeneralTabProps {
  month: string;
  setMonth: (value: string) => void;
  day: string;
  setDay: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  gradeLevel: number | null;
  bio: string;
  setBio: (value: string) => void;
  languagePreference: string;
  setLanguagePreference: (value: string) => void;
  timezone: string;
  setTimezone: (value: string) => void;
  gradeOverride: number | null;
  setGradeOverride: (value: number | null) => void;
}

const GeneralTab = ({
  month,
  setMonth,
  day,
  setDay,
  year,
  setYear,
  gradeLevel,
  bio,
  setBio,
  languagePreference,
  setLanguagePreference,
  timezone,
  setTimezone,
  gradeOverride,
  setGradeOverride,
}: GeneralTabProps) => {
  const [useCustomGrade, setUseCustomGrade] = useState(gradeOverride !== null);

  // Generate arrays for the dropdowns
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));
  
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));

  const grades = Array.from({ length: 13 }, (_, i) => ({
    value: i.toString(),
    label: i === 0 ? "Kindergarten" : `Grade ${i}`
  }));

  const handleGradeOverrideToggle = (checked: boolean) => {
    setUseCustomGrade(checked);
    if (!checked) {
      setGradeOverride(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Birthday</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={day} onValueChange={setDay}>
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {days.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Grade Level</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="custom-grade" className="text-sm">Custom Grade</Label>
            <Switch
              id="custom-grade"
              checked={useCustomGrade}
              onCheckedChange={handleGradeOverrideToggle}
            />
          </div>
        </div>
        
        {useCustomGrade ? (
          <Select
            value={gradeOverride?.toString() ?? ""}
            onValueChange={(value) => setGradeOverride(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {grades.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-lg font-semibold">
            {gradeLevel === 0 ? "Kindergarten" : `Grade ${gradeLevel}`}
            <p className="text-sm text-muted-foreground mt-1">
              Grade level is automatically calculated based on your birthday
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="space-y-2">
        <Label>Language</Label>
        <Select value={languagePreference} onValueChange={setLanguagePreference}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">Eastern Time</SelectItem>
            <SelectItem value="America/Chicago">Central Time</SelectItem>
            <SelectItem value="America/Denver">Mountain Time</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default GeneralTab;