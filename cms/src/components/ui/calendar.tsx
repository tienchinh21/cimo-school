import type { ComponentProps } from 'react';
import { DayPicker } from 'react-day-picker';

import { cn } from '../../lib/utils';

export type CalendarProps = ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col gap-3 sm:flex-row sm:gap-4',
        month: 'space-y-3',
        month_caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-semibold',
        nav: 'absolute inset-x-0 top-1 flex items-center justify-between',
        button_previous:
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-foreground opacity-70 transition hover:bg-muted hover:opacity-100',
        button_next:
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-foreground opacity-70 transition hover:bg-muted hover:opacity-100',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'h-8 w-9 text-center text-[0.78rem] font-medium text-muted-foreground',
        weeks: 'space-y-1',
        week: 'flex w-full',
        day: 'h-9 w-9 p-0 text-center text-sm',
        day_button: 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-normal transition hover:bg-muted',
        selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        today: 'bg-muted text-foreground',
        outside: 'text-muted-foreground opacity-40',
        disabled: 'text-muted-foreground opacity-40',
        hidden: 'invisible',
        range_start: 'rounded-l-lg bg-primary text-primary-foreground',
        range_middle: 'bg-muted text-foreground',
        range_end: 'rounded-r-lg bg-primary text-primary-foreground',
        ...classNames,
      }}
      {...props}
    />
  );
}
