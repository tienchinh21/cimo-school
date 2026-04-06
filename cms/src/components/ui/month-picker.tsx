import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface MonthPickerProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const monthLabels = Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`);

const parseMonthValue = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
};

const formatMonthValue = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

const formatDisplay = (value: string) => {
  const parsed = parseMonthValue(value);
  if (!parsed) {
    return 'Chọn tháng';
  }

  const date = new Date(parsed.year, parsed.month - 1, 1);
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export function MonthPicker({ value, onChange, placeholder = 'Chọn tháng', disabled, className }: MonthPickerProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [yearDraft, setYearDraft] = useState<number | null>(null);

  const parsed = useMemo(() => parseMonthValue(value), [value]);
  const activeYear = yearDraft ?? parsed?.year ?? now.getFullYear();
  const activeMonth = parsed?.month ?? null;
  const buttonLabel = value ? formatDisplay(value) : placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setYearDraft(parsed?.year ?? now.getFullYear());
        } else {
          setYearDraft(null);
        }
      }}
    >
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

      <PopoverContent className='w-[290px] p-3' align='start'>
        <div className='mb-3 flex items-center justify-between'>
          <Button type='button' size='icon' variant='ghost' className='h-8 w-8 rounded-lg' onClick={() => setYearDraft(activeYear - 1)}>
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <p className='text-sm font-semibold'>{activeYear}</p>

          <Button type='button' size='icon' variant='ghost' className='h-8 w-8 rounded-lg' onClick={() => setYearDraft(activeYear + 1)}>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>

        <div className='grid grid-cols-3 gap-2'>
          {monthLabels.map((label, index) => {
            const month = index + 1;
            const isSelected = activeYear === parsed?.year && month === activeMonth;

            return (
              <Button
                key={label}
                type='button'
                size='sm'
                variant={isSelected ? 'default' : 'secondary'}
                className='h-9 rounded-lg px-2 text-xs'
                onClick={() => {
                  onChange(formatMonthValue(activeYear, month));
                  setOpen(false);
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className='mt-3 flex justify-end border-t border-border pt-2'>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              onChange(formatMonthValue(now.getFullYear(), now.getMonth() + 1));
              setOpen(false);
            }}
          >
            Tháng này
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
