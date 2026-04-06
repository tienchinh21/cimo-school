import { useMemo, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DatePickerProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const parseDateString = (value: string) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplay = (value: string) => {
  const date = parseDateString(value);
  if (!date) {
    return 'Chọn ngày';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export function DatePicker({ value, onChange, placeholder = 'Chọn ngày', disabled, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseDateString(value), [value]);
  const buttonLabel = value ? formatDisplay(value) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='secondary'
          className={cn('h-10 w-full justify-between rounded-xl px-3 font-medium', !value && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <span>{buttonLabel}</span>
          <CalendarDays className='h-4 w-4 text-muted-foreground' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-2' align='start'>
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              return;
            }
            onChange(toDateString(date));
            setOpen(false);
          }}
          initialFocus
        />

        <div className='mt-2 flex items-center justify-between gap-2 border-t border-border pt-2'>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              onChange(toDateString(new Date()));
              setOpen(false);
            }}
          >
            Hôm nay
          </Button>

          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              onChange('');
            }}
            disabled={!value}
          >
            <X className='h-4 w-4' />
            Xóa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
