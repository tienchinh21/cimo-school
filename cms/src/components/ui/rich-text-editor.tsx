import {type ComponentType, useEffect, useMemo, useRef} from 'react';
import {Bold, Italic, Link2, List, ListOrdered, Pilcrow, Underline} from 'lucide-react';
import {Button} from './button';
import {cn} from '../../lib/utils';

interface RichTextEditorProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

type EditorCommand =
  | {type: 'bold'}
  | {type: 'italic'}
  | {type: 'underline'}
  | {type: 'insertUnorderedList'}
  | {type: 'insertOrderedList'}
  | {type: 'formatBlock'; value: string}
  | {type: 'createLink'};

const commands: Array<{label: string; command: EditorCommand; icon: ComponentType<{className?: string}>}> = [
  {label: 'Bold', command: {type: 'bold'}, icon: Bold},
  {label: 'Italic', command: {type: 'italic'}, icon: Italic},
  {label: 'Underline', command: {type: 'underline'}, icon: Underline},
  {label: 'Bullet list', command: {type: 'insertUnorderedList'}, icon: List},
  {label: 'Numbered list', command: {type: 'insertOrderedList'}, icon: ListOrdered},
  {label: 'Paragraph', command: {type: 'formatBlock', value: 'p'}, icon: Pilcrow},
  {label: 'Link', command: {type: 'createLink'}, icon: Link2},
];

export function RichTextEditor({
  value,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const normalizedValue = useMemo(() => value ?? '', [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  const runCommand = (command: EditorCommand) => {
    if (disabled) {
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();

    if (command.type === 'createLink') {
      const url = window.prompt('Nhập URL liên kết');
      if (!url?.trim()) {
        return;
      }
      document.execCommand('createLink', false, url.trim());
      onChange(editor.innerHTML);
      return;
    }

    if (command.type === 'formatBlock') {
      document.execCommand('formatBlock', false, command.value);
      onChange(editor.innerHTML);
      return;
    }

    document.execCommand(command.type, false);
    onChange(editor.innerHTML);
  };

  return (
    <div className='rounded-xl border border-border bg-white/95 shadow-sm'>
      <div className='flex flex-wrap items-center gap-1 border-b border-border/80 p-2'>
        {commands.map(({label, command, icon: Icon}) => (
          <Button
            key={label}
            type='button'
            variant='ghost'
            size='sm'
            className='h-8 px-2'
            onClick={() => runCommand(command)}
            disabled={disabled}
            title={label}
            aria-label={label}
          >
            <Icon className='h-4 w-4' />
          </Button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'cms-richtext min-h-[220px] w-full px-3 py-3 text-sm outline-none',
          disabled ? 'cursor-not-allowed bg-muted/30 text-muted-foreground' : 'bg-white text-foreground'
        )}
        onInput={(event) => {
          onChange((event.currentTarget as HTMLDivElement).innerHTML);
        }}
      />
    </div>
  );
}
