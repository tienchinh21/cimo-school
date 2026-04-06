import {type FormEvent, useEffect, useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {Input} from '../ui/input';
import {Label} from '../ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';
import {Textarea} from '../ui/textarea';
import {DatePicker} from '../ui/date-picker';
import {DateRangePicker} from '../ui/date-range-picker';
import {RichTextEditor} from '../ui/rich-text-editor';
import {formatDateInput, getErrorMessage, toApiDateTime} from '../../lib/utils';
import {fetchParentsByStudentId} from '../../services/cms-detail-api';
import {
  createResource,
  fetchCollection,
  translateViToEnTexts,
  updateResource,
  uploadLandingAsset
} from '../../services/cms-api';
import type {CmsField, CmsRecord, CmsResourceConfig, ReferenceOptionsMap} from '../../types/cms';

interface ResourceFormDialogProps {
  resource: CmsResourceConfig;
  mode: 'create' | 'edit';
  open: boolean;
  loading: boolean;
  initialData?: CmsRecord | null;
  referenceOptions: ReferenceOptionsMap;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

const EMPTY_SELECT_VALUE = '__empty_select__';
const currencyFieldKeys = new Set(['costPerSession', 'customCostPerSession']);

const toCurrencyDigits = (value: string) => value.replace(/[^\d]/g, '');

const formatCurrencyText = (value: string) => {
  const digits = toCurrencyDigits(value);
  if (!digits) {
    return '';
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const emptyByType = (field: CmsField) => {
  if (field.type === 'multi-select') {
    return [] as string[];
  }
  return '';
};

const toArray = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const plainTextFromRichtext = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();

const normalizeValue = (field: CmsField, source?: CmsRecord | null) => {
  if (field.type === 'password') {
    return '';
  }

  const raw = source?.[field.key];

  if (raw === null || raw === undefined) {
    return emptyByType(field);
  }

  if (field.type === 'multi-select') {
    if (Array.isArray(raw)) {
      return raw.map(String);
    }
    return [];
  }

  if (field.type === 'array' || field.type === 'seo-keywords') {
    if (Array.isArray(raw)) {
      return raw.map(String).join('\n');
    }
    return String(raw);
  }

  if (field.type === 'date') {
    return formatDateInput(raw);
  }

  if (field.valueType === 'boolean') {
    if (typeof raw === 'boolean') {
      return raw ? 'true' : 'false';
    }
    return String(raw);
  }

  return String(raw);
};

const shouldShowField = (field: CmsField, mode: 'create' | 'edit') => {
  if (mode === 'create' && field.hiddenOnCreate) return false;
  if (mode === 'edit' && field.hiddenOnEdit) return false;
  if (mode === 'create' && field.onlyOnEdit) return false;
  if (mode === 'edit' && field.onlyOnCreate) return false;
  return true;
};

const buildSeoKeywords = (values: Record<string, unknown>) => {
  const manual = typeof values.seoKeywords === 'string' ? toArray(values.seoKeywords) : [];
  if (manual.length > 0) {
    return manual;
  }

  const candidates = [
    values.seoTitle,
    values.seoDescription,
    values.title,
    values.name,
    values.description,
    values.excerpt,
  ]
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);

  if (candidates.length === 0) {
    return [];
  }

  const words = candidates
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);

  return Array.from(new Set(words)).slice(0, 18);
};

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Không thể đọc file.'));
    reader.readAsDataURL(file);
  });

const landingIdentityFieldByResource: Record<string, string> = {
  'landing-page-seo': 'pageKey',
  'landing-courses': 'courseId',
  'landing-testimonials': 'testimonialId',
  'landing-trial-sessions': 'sessionId',
  'landing-social-metrics': 'metricId',
  'landing-method-steps': 'stepId',
  'landing-team-milestones': 'milestoneId',
  'landing-about-metrics': 'metricId',
  'landing-about-pillars': 'pillarId',
  'landing-recruitment-tracks': 'trackId',
  'landing-blogs': 'slug',
};

const nonTranslatableFieldKeys = new Set([
  'id',
  'locale',
  'courseId',
  'trackId',
  'relatedTrackId',
  'testimonialId',
  'sessionId',
  'metricId',
  'stepId',
  'milestoneId',
  'pillarId',
  'pageKey',
  'slug',
  'path',
  'fileName',
  'mimeType',
  'diskPath',
  'publicUrl',
  'status',
  'source',
  'email',
  'phone',
  'publishedAt',
  'startDate',
  'readingTime',
  'seatsLeft',
  'orderIndex',
  'year',
  'noIndex',
  'consent',
]);

type TranslationTarget = {
  key: string;
  source: string;
  index?: number;
};

const normalizeForCompare = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForCompare(item));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeForCompare((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
};

const isSameValue = (a: unknown, b: unknown) =>
  JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));

const collectTranslationTargets = (
  payload: Record<string, unknown>,
  fields: CmsField[]
) => {
  const targets: TranslationTarget[] = [];

  for (const field of fields) {
    if (nonTranslatableFieldKeys.has(field.key)) {
      continue;
    }

    if (field.reference || field.options || field.valueType === 'boolean') {
      continue;
    }

    if (
      field.type !== 'text' &&
      field.type !== 'textarea' &&
      field.type !== 'richtext' &&
      field.type !== 'array' &&
      field.type !== 'seo-keywords'
    ) {
      continue;
    }

    const value = payload[field.key];
    if (typeof value === 'string') {
      if (value.trim()) {
        targets.push({
          key: field.key,
          source: value,
        });
      }
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const text = String(item ?? '').trim();
        if (!text) {
          return;
        }

        targets.push({
          key: field.key,
          source: text,
          index,
        });
      });
    }
  }

  return targets;
};

export function ResourceFormDialog({
  resource,
  mode,
  open,
  loading,
  initialData,
  referenceOptions,
  onOpenChange,
  onSubmit,
}: ResourceFormDialogProps) {
  const activeFields = useMemo(
    () => resource.fields.filter((field) => shouldShowField(field, mode)),
    [resource.fields, mode]
  );

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [initialValues, setInitialValues] = useState<Record<string, unknown>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [errorText, setErrorText] = useState('');
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [isSeoEditedManually, setIsSeoEditedManually] = useState(false);
  const [isGeneratingEnglish, setIsGeneratingEnglish] = useState(false);

  const selectedStudentId = useMemo(() => {
    if (resource.key !== 'student-leaves') {
      return '';
    }

    const value = values.soStudentId;
    return typeof value === 'string' ? value : '';
  }, [resource.key, values.soStudentId]);

  const studentParentOptionsQuery = useQuery({
    queryKey: ['resource-form', 'student-leave-parents', selectedStudentId],
    queryFn: () => fetchParentsByStudentId(selectedStudentId),
    enabled: open && resource.key === 'student-leaves' && Boolean(selectedStudentId),
  });

  const studentParentOptions = useMemo(() => {
    if (resource.key !== 'student-leaves') {
      return [];
    }

    return (studentParentOptionsQuery.data ?? []).map((item) => ({
      value: String(item.id),
      label: `${String(item.name ?? item.id)}${item.relation ? ` - ${String(item.relation)}` : ''}`,
    }));
  }, [resource.key, studentParentOptionsQuery.data]);

  const seoKeywordsField = useMemo(
    () => activeFields.find((field) => field.type === 'seo-keywords'),
    [activeFields]
  );

  const isUploading = useMemo(
    () => Object.values(uploadingFields).some(Boolean),
    [uploadingFields]
  );

  const currentLocale = typeof values.locale === 'string' ? values.locale : '';
  const englishIdentityField = landingIdentityFieldByResource[resource.key];
  const canGenerateEnglishVariant = currentLocale === 'vi' && Boolean(englishIdentityField);
  const isBusy = loading || isUploading || isGeneratingEnglish;

  useEffect(() => {
    if (!open) {
      return;
    }

    const next: Record<string, unknown> = {};
    activeFields.forEach((field) => {
      next[field.key] = normalizeValue(field, initialData);
    });

    setValues(next);
    setInitialValues(next);
    setTouchedFields({});
    setErrorText('');
    setUploadingFields({});
    setIsSeoEditedManually(false);
    setIsGeneratingEnglish(false);
  }, [activeFields, initialData, open]);

  const markFieldTouched = (fieldKey: string) => {
    setTouchedFields((prev) => {
      if (prev[fieldKey]) {
        return prev;
      }

      return {
        ...prev,
        [fieldKey]: true,
      };
    });
  };

  useEffect(() => {
    if (resource.key !== 'student-leaves') {
      return;
    }

    const selectedParentId = typeof values.soParentId === 'string' ? values.soParentId : '';
    if (!selectedParentId) {
      return;
    }

    const stillValid = studentParentOptions.some((item) => item.value === selectedParentId);
    if (!stillValid) {
      setValues((prev) => ({
        ...prev,
        soParentId: '',
      }));
    }
  }, [resource.key, studentParentOptions, values.soParentId]);

  useEffect(() => {
    if (!open || !seoKeywordsField || isSeoEditedManually) {
      return;
    }

    const current = typeof values[seoKeywordsField.key] === 'string' ? String(values[seoKeywordsField.key]) : '';
    if (current.trim()) {
      return;
    }

    const generated = buildSeoKeywords(values);
    if (generated.length === 0) {
      return;
    }

    setValues((prev) => ({
      ...prev,
      [seoKeywordsField.key]: generated.join('\n'),
    }));
  }, [isSeoEditedManually, open, seoKeywordsField, values]);

  const uploadImageField = async (fieldKey: string, file: File) => {
    setErrorText('');
    setUploadingFields((prev) => ({...prev, [fieldKey]: true}));

    try {
      const base64 = await fileToBase64(file);
      const locale = typeof values.locale === 'string' ? values.locale : undefined;
      const titleCandidate =
        (typeof values.title === 'string' && values.title) ||
        (typeof values.name === 'string' && values.name) ||
        (typeof values.seoTitle === 'string' && values.seoTitle) ||
        undefined;
      const altCandidate =
        (typeof values.imageAlt === 'string' && values.imageAlt) ||
        (typeof values.alt === 'string' && values.alt) ||
        undefined;

      const uploaded = await uploadLandingAsset({
        data: base64,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        locale,
        title: titleCandidate,
        alt: altCandidate,
      });

      setValues((prev) => ({
        ...prev,
        [fieldKey]: String(uploaded.publicUrl ?? ''),
      }));
      markFieldTouched(fieldKey);
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setUploadingFields((prev) => ({...prev, [fieldKey]: false}));
    }
  };

  const buildPayloadFromValues = (
    sourceValues: Record<string, unknown>,
    options: { validateRequired: boolean } = { validateRequired: true }
  ) => {
    const payload: Record<string, unknown> = {};

    for (const field of activeFields) {
      const raw = sourceValues[field.key];
      const isTouched = Boolean(touchedFields[field.key]);
      const shouldValidateRequired = options.validateRequired && (mode === 'create' || isTouched);

      if (field.type === 'multi-select') {
        const options = Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
        if (field.required && options.length === 0 && shouldValidateRequired) {
          throw new Error(`Vui lòng chọn ${field.label.toLowerCase()}.`);
        }
        if (options.length > 0) {
          payload[field.key] = options;
        }
        continue;
      }

      if (field.type === 'array' || field.type === 'seo-keywords') {
        const options = typeof raw === 'string' ? toArray(raw) : [];
        if (field.required && options.length === 0 && shouldValidateRequired) {
          throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
        }
        if (options.length > 0) {
          payload[field.key] = options;
        }
        continue;
      }

      if (field.type === 'richtext') {
        const value = typeof raw === 'string' ? raw : '';
        if (field.required && !plainTextFromRichtext(value) && shouldValidateRequired) {
          throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
        }
        if (plainTextFromRichtext(value)) {
          payload[field.key] = value;
        }
        continue;
      }

      if (field.type === 'image') {
        const value = typeof raw === 'string' ? raw.trim() : '';
        if (field.required && !value && shouldValidateRequired) {
          throw new Error(`Vui lòng upload ${field.label.toLowerCase()}.`);
        }
        if (value) {
          payload[field.key] = value;
        }
        continue;
      }

      if (field.type === 'date') {
        const value = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();

        if (field.required && !value && shouldValidateRequired) {
          throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
        }

        if (!value) {
          continue;
        }

        payload[field.key] = toApiDateTime(value);
        continue;
      }

      const value = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();

      if (field.required && !value && shouldValidateRequired) {
        throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
      }

      if (!value) {
        continue;
      }

      if (field.valueType === 'boolean') {
        payload[field.key] = value === 'true';
        continue;
      }

      payload[field.key] = value;
    }

    return resource.normalizePayload
      ? resource.normalizePayload(payload, {mode})
      : payload;
  };

  const buildPayload = () => buildPayloadFromValues(values, {validateRequired: true});

  const buildPatchPayload = (payload: Record<string, unknown>) => {
    if (mode !== 'edit') {
      return payload;
    }

    const previousPayload = buildPayloadFromValues(initialValues, {validateRequired: false});
    const touchedKeys = Object.keys(touchedFields).filter((key) => touchedFields[key]);

    return touchedKeys.reduce<Record<string, unknown>>((acc, key) => {
      const hasCurrent = Object.prototype.hasOwnProperty.call(payload, key);
      const hasPrevious = Object.prototype.hasOwnProperty.call(previousPayload, key);

      if (!hasCurrent && !hasPrevious) {
        return acc;
      }

      if (hasCurrent && hasPrevious && isSameValue(payload[key], previousPayload[key])) {
        return acc;
      }

      if (hasCurrent) {
        acc[key] = payload[key];
      }

      return acc;
    }, {});
  };

  const applyTranslationsToPayload = (
    sourcePayload: Record<string, unknown>,
    targets: TranslationTarget[],
    translatedTexts: string[]
  ) => {
    const next = {...sourcePayload};

    targets.forEach((target, index) => {
      const translated = translatedTexts[index] ?? target.source;

      if (typeof target.index === 'number') {
        const current = Array.isArray(next[target.key]) ? [...(next[target.key] as string[])] : [];
        current[target.index] = translated;
        next[target.key] = current;
        return;
      }

      next[target.key] = translated;
    });

    return next;
  };

  const upsertEnglishVariant = async (
    identityField: string,
    identityValue: string,
    payload: Record<string, unknown>
  ) => {
    const where: Record<string, unknown> = {
      and: [
        {locale: 'en'},
        {[identityField]: identityValue},
      ],
    };

    const existingEnRecords = await fetchCollection(resource.endpoint, {
      limit: 1,
      where,
    });

    const existing = existingEnRecords[0];
    if (existing?.id) {
      const changedPayload = Object.keys(payload).reduce<Record<string, unknown>>((acc, key) => {
        if (isSameValue(payload[key], existing[key])) {
          return acc;
        }

        acc[key] = payload[key];
        return acc;
      }, {});

      if (Object.keys(changedPayload).length > 0) {
        await updateResource(resource.endpoint, String(existing.id), changedPayload);
      }

      return;
    }

    await createResource(resource.endpoint, payload);
  };

  const handleGenerateEnglishVariant = async () => {
    if (!englishIdentityField) {
      return;
    }

    try {
      setErrorText('');
      setIsGeneratingEnglish(true);

      const vietnamesePayload = buildPayload();
      const identityValue = String(vietnamesePayload[englishIdentityField] ?? '').trim();
      if (!identityValue) {
        throw new Error(`Thiếu trường định danh (${englishIdentityField}) để tạo bản EN.`);
      }

      const translationTargets = collectTranslationTargets(vietnamesePayload, activeFields);
      const translatedTexts = await translateViToEnTexts(
        translationTargets.map((target) => target.source)
      );

      const englishPayload = applyTranslationsToPayload(
        {
          ...vietnamesePayload,
          locale: 'en',
        },
        translationTargets,
        translatedTexts
      );

      const submitPayload = buildPatchPayload(vietnamesePayload);
      if (mode === 'edit' && Object.keys(submitPayload).length === 0) {
        throw new Error('Chưa có thay đổi để cập nhật.');
      }

      await upsertEnglishVariant(englishIdentityField, identityValue, englishPayload);
      await onSubmit(submitPayload);
      onOpenChange(false);
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setIsGeneratingEnglish(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload = buildPatchPayload(buildPayload());
      if (mode === 'edit' && Object.keys(payload).length === 0) {
        throw new Error('Chưa có thay đổi để cập nhật.');
      }

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      setErrorText(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? `Thêm ${resource.title}` : `Cập nhật ${resource.title}`}</DialogTitle>
          <DialogDescription>{resource.subtitle}</DialogDescription>
        </DialogHeader>

        <form className='grid max-h-[70vh] gap-4 overflow-y-auto pr-1' onSubmit={handleSubmit}>
          <div className='grid gap-4 md:grid-cols-2'>
            {activeFields.map((field) => {
              const value = values[field.key];
              const isStudentLeaveRangeStartField = resource.key === 'student-leaves' && field.key === 'leaveStartDate';
              const isStudentLeaveRangeEndField = resource.key === 'student-leaves' && field.key === 'leaveEndDate';
              const isClassRangeStartField = resource.key === 'classes' && field.key === 'fromDate';
              const isClassRangeEndField = resource.key === 'classes' && field.key === 'toDate';
              const isStudentLeaveParentField = resource.key === 'student-leaves' && field.key === 'soParentId';
              const options = isStudentLeaveParentField
                ? studentParentOptions
                : field.reference
                  ? referenceOptions[field.reference]
                  : field.options ?? [];
              const isLong = field.type === 'textarea' || field.type === 'array' || field.type === 'richtext' || field.type === 'seo-keywords';

              if (isStudentLeaveRangeEndField || isClassRangeEndField) {
                return null;
              }

              return (
                <div key={field.key} className={isLong ? 'md:col-span-2' : ''}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </Label>

                  <div className='mt-1.5'>
                    {(field.type === 'text' || field.type === 'password') && (
                      <Input
                        id={field.key}
                        type={field.type}
                        value={
                          typeof value === 'string'
                            ? field.type === 'text' && currencyFieldKeys.has(field.key)
                              ? formatCurrencyText(value)
                              : value
                            : ''
                        }
                        placeholder={field.placeholder}
                        onChange={(event) => {
                          markFieldTouched(field.key);
                          const nextValue =
                            field.type === 'text' && currencyFieldKeys.has(field.key)
                              ? toCurrencyDigits(event.target.value)
                              : event.target.value;
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: nextValue,
                          }));
                        }}
                      />
                    )}

                    {field.type === 'date' && isStudentLeaveRangeStartField && (
                      <DateRangePicker
                        startValue={typeof values.leaveStartDate === 'string' ? values.leaveStartDate : ''}
                        endValue={typeof values.leaveEndDate === 'string' ? values.leaveEndDate : ''}
                        onChange={(nextStartValue, nextEndValue) => {
                          markFieldTouched('leaveStartDate');
                          markFieldTouched('leaveEndDate');
                          setValues((prev) => ({
                            ...prev,
                            leaveStartDate: nextStartValue,
                            leaveEndDate: nextEndValue,
                          }));
                        }}
                        placeholder='Chọn khoảng ngày nghỉ'
                      />
                    )}

                    {field.type === 'date' && isClassRangeStartField && (
                      <DateRangePicker
                        startValue={typeof values.fromDate === 'string' ? values.fromDate : ''}
                        endValue={typeof values.toDate === 'string' ? values.toDate : ''}
                        onChange={(nextStartValue, nextEndValue) => {
                          markFieldTouched('fromDate');
                          markFieldTouched('toDate');
                          setValues((prev) => ({
                            ...prev,
                            fromDate: nextStartValue,
                            toDate: nextEndValue,
                          }));
                        }}
                        placeholder='Chọn khoảng ngày học'
                      />
                    )}

                    {field.type === 'date' && !isStudentLeaveRangeStartField && !isClassRangeStartField && (
                      <DatePicker
                        value={typeof value === 'string' ? value : ''}
                        onChange={(nextValue) => {
                          markFieldTouched(field.key);
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: nextValue,
                          }));
                        }}
                        placeholder={`Chọn ${field.label.toLowerCase()}`}
                      />
                    )}

                    {(field.type === 'textarea' || field.type === 'array') && (
                      <Textarea
                        id={field.key}
                        rows={field.type === 'array' ? 4 : 6}
                        value={typeof value === 'string' ? value : ''}
                        placeholder={field.placeholder}
                        onChange={(event) => {
                          markFieldTouched(field.key);
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: event.target.value,
                          }));
                        }}
                      />
                    )}

                    {field.type === 'seo-keywords' && (
                      <div className='space-y-2'>
                        <Textarea
                          id={field.key}
                          rows={4}
                          value={typeof value === 'string' ? value : ''}
                          placeholder='Mỗi dòng hoặc dấu phẩy là 1 keyword'
                          onChange={(event) => {
                            setIsSeoEditedManually(true);
                            markFieldTouched(field.key);
                            setValues((prev) => ({
                              ...prev,
                              [field.key]: event.target.value,
                            }));
                          }}
                        />
                        <Button
                          type='button'
                          variant='secondary'
                          size='sm'
                          onClick={() => {
                            const generated = buildSeoKeywords(values);
                            setIsSeoEditedManually(true);
                            markFieldTouched(field.key);
                            setValues((prev) => ({
                              ...prev,
                              [field.key]: generated.join('\n'),
                            }));
                          }}
                        >
                          Tạo keyword tự động
                        </Button>
                      </div>
                    )}

                    {field.type === 'richtext' && (
                      <RichTextEditor
                        value={typeof value === 'string' ? value : ''}
                        onChange={(nextValue) => {
                          markFieldTouched(field.key);
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: nextValue,
                          }));
                        }}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === 'image' && (
                      <div className='space-y-2'>
                        <Input
                          id={field.key}
                          type='text'
                          value={typeof value === 'string' ? value : ''}
                          placeholder='URL ảnh hoặc upload bên dưới'
                          onChange={(event) => {
                            markFieldTouched(field.key);
                            setValues((prev) => ({
                              ...prev,
                              [field.key]: event.target.value,
                            }));
                          }}
                        />
                        <Input
                          type='file'
                          accept='image/*'
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            await uploadImageField(field.key, file);
                            event.target.value = '';
                          }}
                        />
                        {uploadingFields[field.key] ? (
                          <p className='text-xs text-muted-foreground'>Đang upload ảnh...</p>
                        ) : null}
                        {typeof value === 'string' && value.trim() ? (
                          <div className='overflow-hidden rounded-lg border border-border/70 bg-muted/20 p-2'>
                            <img
                              src={value}
                              alt={field.label}
                              className='h-28 w-full rounded-md object-cover'
                              loading='lazy'
                            />
                          </div>
                        ) : null}
                      </div>
                    )}

                    {field.type === 'select' && (
                      <Select
                        disabled={isStudentLeaveParentField && (!selectedStudentId || studentParentOptionsQuery.isLoading)}
                        value={typeof value === 'string' && value ? value : EMPTY_SELECT_VALUE}
                        onValueChange={(nextValue) => {
                          markFieldTouched(field.key);
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: nextValue === EMPTY_SELECT_VALUE ? '' : nextValue,
                          }));
                        }}
                      >
                        <SelectTrigger id={field.key}>
                          <SelectValue placeholder={`Chọn ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_SELECT_VALUE}>
                            {isStudentLeaveParentField && !selectedStudentId ? 'Chọn học sinh trước' : `Chọn ${field.label.toLowerCase()}`}
                          </SelectItem>
                          {options.length === 0 && isStudentLeaveParentField && selectedStudentId ? (
                            <SelectItem value='__no_parent_available__' disabled>
                              Không có phụ huynh nào của học sinh đã chọn
                            </SelectItem>
                          ) : null}
                          {options.map((option) => (
                            <SelectItem value={option.value} key={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'multi-select' && (
                      <select
                        id={field.key}
                        multiple
                        className='min-h-28 w-full rounded-xl border border-border bg-white/90 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        value={Array.isArray(value) ? value.map(String) : []}
                        onChange={(event) => {
                          const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                          markFieldTouched(field.key);
                          setValues((prev) => ({
                            ...prev,
                            [field.key]: selected,
                          }));
                        }}
                      >
                        {options.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {field.description ? <p className='mt-1 text-xs text-muted-foreground'>{field.description}</p> : null}
                </div>
              );
            })}
          </div>

          {errorText ? <p className='text-sm font-medium text-danger'>{errorText}</p> : null}

          <DialogFooter>
            <Button type='button' variant='secondary' onClick={() => onOpenChange(false)} disabled={isBusy}>
              Hủy
            </Button>
            {canGenerateEnglishVariant ? (
              <Button type='button' variant='secondary' onClick={handleGenerateEnglishVariant} disabled={isBusy}>
                {isGeneratingEnglish ? 'Đang sinh EN...' : 'Lưu + sinh EN'}
              </Button>
            ) : null}
            <Button type='submit' disabled={isBusy}>
              {loading ? 'Đang lưu...' : isUploading ? 'Đang upload...' : isGeneratingEnglish ? 'Đang sinh EN...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
