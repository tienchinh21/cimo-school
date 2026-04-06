import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-primary/15 text-primary',
      secondary: 'bg-muted text-muted-foreground',
      success: 'bg-emerald-500/15 text-emerald-700',
      warning: 'bg-amber-500/20 text-amber-700',
      danger: 'bg-danger/15 text-danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
