import { useMemo, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DateRangePickerProps {
  startValue: string;
  endValue: string;
  onChange: (startValue: string, endValue: string) => void;
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

const formatSingleDate = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

const formatDisplay = (startValue: string, endValue: string) => {
  const startDate = parseDateString(startValue);
  if (!startDate) {
    return 'Chọn khoảng ngày';
  }

  const endDate = parseDateString(endValue);
  if (!endDate) {
    return `${formatSingleDate(startDate)} - ...`;
  }

  return `${formatSingleDate(startDate)} - ${formatSingleDate(endDate)}`;
};

export function DateRangePicker({
  startValue,
  endValue,
  onChange,
  placeholder = 'Chọn khoảng ngày',
  disabled,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [anchorDate, setAnchorDate] = useState<Date | null>(null);

  const selectedRange = useMemo<DateRange | undefined>(() => {
    const from = parseDateString(startValue);
    if (!from) {
      return undefined;
    }

    const to = parseDateString(endValue);
    return {
      from,
      to,
    };
  }, [endValue, startValue]);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(selectedRange);

  const hasValue = Boolean(startValue);
  const buttonLabel = hasValue ? formatDisplay(startValue, endValue) : placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setDraftRange(selectedRange);
        }
        if (!nextOpen) {
          setAnchorDate(null);
          setDraftRange(selectedRange);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='secondary'
          className={cn('h-10 w-full justify-between rounded-xl px-3 font-medium', !hasValue && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          <span>{buttonLabel}</span>
          <CalendarDays className='h-4 w-4 text-muted-foreground' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-auto p-2' align='start'>
        <Calendar
          mode='range'
          selected={draftRange}
          onSelect={(_, selectedDay) => {
            if (!selectedDay) {
              onChange('', '');
              setAnchorDate(null);
              setDraftRange(undefined);
              return;
            }

            if (!anchorDate) {
              const nextStartValue = toDateString(selectedDay);
              setAnchorDate(selectedDay);
              setDraftRange({
                from: selectedDay,
                to: undefined,
              });
              onChange(nextStartValue, '');
              return;
            }

            const [startDate, endDate] =
              anchorDate.getTime() <= selectedDay.getTime() ? [anchorDate, selectedDay] : [selectedDay, anchorDate];
            onChange(toDateString(startDate), toDateString(endDate));
            setAnchorDate(null);
            setDraftRange({
              from: startDate,
              to: endDate,
            });
            setOpen(false);
          }}
          initialFocus
          numberOfMonths={2}
        />

        <div className='mt-2 flex items-center justify-between gap-2 border-t border-border pt-2'>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              const todayValue = toDateString(new Date());
              onChange(todayValue, todayValue);
              setAnchorDate(null);
              setDraftRange({
                from: parseDateString(todayValue),
                to: parseDateString(todayValue),
              });
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
              onChange('', '');
              setAnchorDate(null);
              setDraftRange(undefined);
            }}
            disabled={!hasValue}
          >
            <X className='h-4 w-4' />
            Xóa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
