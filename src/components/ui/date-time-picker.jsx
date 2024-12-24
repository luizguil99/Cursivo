import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DateTimePicker({ date, setDate, className, label }) {
  const [selectedDate, setSelectedDate] = React.useState(date);
  const [selectedHour, setSelectedHour] = React.useState(
    date ? date.getHours().toString().padStart(2, "0") : "12"
  );
  const [selectedMinute, setSelectedMinute] = React.useState(
    date ? date.getMinutes().toString().padStart(2, "0") : "00"
  );
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Gerar opções de hora (00-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Gerar opções de minutos (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Atualizar a data quando qualquer valor muda
  const updateDate = React.useCallback(
    (newDate, hour, minute) => {
      if (!newDate) return;

      try {
        const updatedDate = new Date(newDate);
        if (isNaN(updatedDate.getTime())) return;

        updatedDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
        setDate(updatedDate);
        setSelectedDate(updatedDate);
      } catch (error) {
        console.error("Erro ao atualizar data:", error);
      }
    },
    [setDate]
  );

  // Atualizar quando a data muda externamente
  React.useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setSelectedHour(date.getHours().toString().padStart(2, "0"));
      setSelectedMinute(date.getMinutes().toString().padStart(2, "0"));
    }
  }, [date]);

  const id = React.useId();

  const handleCalendarSelect = React.useCallback((newDate) => {
    if (newDate) {
      updateDate(newDate, selectedHour, selectedMinute);
    }
  }, [updateDate, selectedHour, selectedMinute]);

  const handleTimeChange = React.useCallback((type, value) => {
    if (type === 'hour') {
      setSelectedHour(value);
      if (selectedDate) {
        updateDate(selectedDate, value, selectedMinute);
      }
    } else {
      setSelectedMinute(value);
      if (selectedDate) {
        updateDate(selectedDate, selectedHour, value);
      }
    }
  }, [selectedDate, selectedHour, selectedMinute, updateDate]);

  return (
    <div
      className={cn("grid gap-2", className)}
      role="group"
      aria-labelledby={`${id}-label`}
    >
      {label && <Label id={`${id}-label`}>{label}</Label>}
      <div className="flex gap-2">
        <Popover
          open={isCalendarOpen}
          onOpenChange={setIsCalendarOpen}
          modal={true}
        >
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
              aria-label="Selecionar data"
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP", { locale: ptBR })
              ) : (
                <span>Selecionar data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <div className="z-[999]">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                initialFocus
                locale={ptBR}
                className="rdp"
              />
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={selectedHour}
          onValueChange={(value) => handleTimeChange('hour', value)}
          modal={true}
        >
          <SelectTrigger
            className="w-[100px]"
            aria-label="Selecionar hora"
          >
            <SelectValue placeholder="Horas" />
          </SelectTrigger>
          <SelectContent
            className="z-[999] h-[200px]"
            position="popper"
          >
            <ScrollArea className="h-full">
              {hours.map((hour) => (
                <SelectItem 
                  key={hour} 
                  value={hour}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  {hour}h
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>

        <Select
          value={selectedMinute}
          onValueChange={(value) => handleTimeChange('minute', value)}
          modal={true}
        >
          <SelectTrigger
            className="w-[100px]"
            aria-label="Selecionar minuto"
          >
            <SelectValue placeholder="Minutos" />
          </SelectTrigger>
          <SelectContent
            className="z-[999] h-[200px]"
            position="popper"
          >
            <ScrollArea className="h-full">
              {minutes.map((minute) => (
                <SelectItem 
                  key={minute} 
                  value={minute}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                >
                  {minute}min
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
