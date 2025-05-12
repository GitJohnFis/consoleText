
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter, X } from "lucide-react";
import type { LogEntry } from "@/types";

const ALL_LEVELS: LogEntry['level'][] = ['error', 'warn', 'info', 'debug', 'delivered', 'blocked'];

interface DashboardFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  activeLevels: LogEntry['level'][];
  onActiveLevelsChange: (levels: LogEntry['level'][]) => void;
}

export function DashboardFilters({
  searchTerm,
  onSearchTermChange,
  activeLevels,
  onActiveLevelsChange,
}: DashboardFiltersProps) {

  const handleLevelToggle = (level: LogEntry['level']) => {
    const newLevels = activeLevels.includes(level)
      ? activeLevels.filter(l => l !== level)
      : [...activeLevels, level];
    onActiveLevelsChange(newLevels);
  };

  const isAllSelected = ALL_LEVELS.length === activeLevels.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
        onActiveLevelsChange([]);
    } else {
        onActiveLevelsChange([...ALL_LEVELS]);
    }
  }

  return (
    <div className="mb-6 p-4 bg-card border rounded-lg shadow-sm flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-grow w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
          aria-label="Search logs"
        />
         {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchTermChange("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filter by Level
            {activeLevels.length > 0 && activeLevels.length < ALL_LEVELS.length && (
              <Badge variant="secondary" className="ml-2">{activeLevels.length}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
            <div className="p-4 border-b">
                 <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Log Levels</Label>
                    <Button variant="link" size="sm" onClick={toggleSelectAll} className="p-0 h-auto">
                        {isAllSelected ? "Deselect All" : "Select All"}
                    </Button>
                 </div>
            </div>
          <div className="p-4 space-y-3">
            {ALL_LEVELS.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`level-${level}`}
                  checked={activeLevels.includes(level)}
                  onCheckedChange={() => handleLevelToggle(level)}
                />
                <Label htmlFor={`level-${level}`} className="text-sm font-normal capitalize cursor-pointer">
                  {level}
                </Label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
