/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

type ConfirmVariant = 'default' | 'danger';

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface PendingConfirm extends Required<ConfirmOptions> {
  resolve: (result: boolean) => void;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | null>(null);

function withDefaults(options: ConfirmOptions): Omit<PendingConfirm, 'resolve'> {
  return {
    title: options.title ?? 'Xác nhận thao tác',
    description: options.description ?? 'Bạn có chắc chắn muốn tiếp tục?',
    confirmText: options.confirmText ?? 'Xác nhận',
    cancelText: options.cancelText ?? 'Hủy',
    variant: options.variant ?? 'default',
  };
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const resolvePending = useCallback((result: boolean) => {
    const current = pendingRef.current;
    if (!current) {
      return;
    }

    current.resolve(result);
    pendingRef.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      const nextPending: PendingConfirm = {
        ...withDefaults(options),
        resolve,
      };

      pendingRef.current = nextPending;
      setPending(nextPending);
    });
  }, []);

  const contextValue = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}

      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) {
            resolvePending(false);
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{pending?.title}</DialogTitle>
            <DialogDescription>{pending?.description}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type='button' variant='secondary' onClick={() => resolvePending(false)}>
              {pending?.cancelText}
            </Button>
            <Button type='button' variant={pending?.variant === 'danger' ? 'danger' : 'default'} onClick={() => resolvePending(true)}>
              {pending?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider.');
  }
  return context;
}
