import {useCallback, useEffect, useRef, useState} from 'react';
import {useFieldArray, useForm} from 'react-hook-form';
import {useNavigate} from 'react-router';
import {getSupabaseClient} from '@play/supabase-client';
import {useSnackbar} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import {TYPE_TO_CATEGORY, TYPE_TO_LABEL} from './constants';
import type {
  CreateGameDialogProps,
  CreateGameStep,
  FormValues,
  SteamGamePreview,
} from './types';
import {
  detectTypeFromUrl,
  isSteamStoreUrl,
  isValidUrl,
  normalizeUrlForComparison,
  sanitizeSlugInput,
  slugifyTitle,
} from './utils';

interface UseCreateGameDialogFlowParams {
  setOpened: CreateGameDialogProps['setOpened'];
}

async function importFromSteamWithPost(input: {gameId: string; steamUrl: string}) {
  const supabase = getSupabaseClient();
  const {
    data: {session},
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch('/api/trpc/game.importFromSteam', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const trpcError = Array.isArray(payload) ? payload[0]?.error : payload?.error;
  if (!response.ok || trpcError) {
    throw new Error(trpcError?.message || `Steam import failed (${response.status})`);
  }
}

export function useCreateGameDialogFlow({
  setOpened,
}: UseCreateGameDialogFlowParams) {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const {showSnackbar} = useSnackbar();

  const [step, setStep] = useState<CreateGameStep>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState('');
  const [debouncedSteamUrl, setDebouncedSteamUrl] = useState('');

  const {control, watch, setValue, getValues, reset} = useForm<FormValues>({
    defaultValues: {
      title: '',
      slug: '',
      steamUrl: '',
      links: [],
    },
  });

  const title = watch('title');
  const slug = watch('slug');
  const steamUrl = watch('steamUrl');

  const {fields, append, remove, replace} = useFieldArray({
    control,
    name: 'links',
  });

  useEffect(() => {
    if (!slugTouched) {
      setValue('slug', slugifyTitle(title));
    }
  }, [title, slugTouched, setValue]);

  const lastAddedIndexRef = useRef<number | null>(null);
  const urlInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (lastAddedIndexRef.current !== null) {
      const input = urlInputRefs.current[lastAddedIndexRef.current];
      input?.focus();
      lastAddedIndexRef.current = null;
    }
  }, [fields.length]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSlug(slug), 300);
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSteamUrl(steamUrl.trim()), 400);
    return () => clearTimeout(timer);
  }, [steamUrl]);

  const {data: slugCheck, isFetching: isFetchingSlugCheck}
    = trpc.gamePage.checkSlug.useQuery(
      {slug: debouncedSlug},
      {
        enabled: debouncedSlug.length >= 3,
        staleTime: 5000,
      },
    );

  const isSteamUrlValid = isSteamStoreUrl(steamUrl);
  const isDebouncedSteamUrlValid = isSteamStoreUrl(debouncedSteamUrl);

  const {
    data: steamPreviewData,
    error: steamPreviewError,
    isFetching: isFetchingSteamPreview,
  } = trpc.game.steamPreview.useQuery(
    {steamUrl: debouncedSteamUrl},
    {
      enabled: step === 'import' && isDebouncedSteamUrlValid,
      staleTime: 60_000,
      retry: false,
    },
  );

  const steamPreview = (steamPreviewData || null) as SteamGamePreview | null;

  const linksInitialized = useRef(false);
  useEffect(() => {
    if (step === 'links' && !linksInitialized.current) {
      linksInitialized.current = true;

      if (steamPreview?.suggestedLinks?.length) {
        replace(
          steamPreview.suggestedLinks.map((link) => ({
            type: link.type,
            url: link.url,
          })),
        );
      } else if (isSteamStoreUrl(steamUrl)) {
        replace([{type: 'steam', url: steamUrl.trim()}]);
      } else {
        replace([{type: '', url: ''}]);
      }
    }

    if (step !== 'links') {
      linksInitialized.current = false;
    }
  }, [replace, steamPreview?.suggestedLinks, steamUrl, step]);

  const createGame = trpc.game.create.useMutation();
  const createLink = trpc.gameLink.create.useMutation();

  const handleClose = useCallback(() => {
    setOpened(false);
    reset();
    setSlugTouched(false);
    setDebouncedSlug('');
    setDebouncedSteamUrl('');
    setStep('create');
    setSubmitError(null);
  }, [reset, setOpened]);

  const setDialogOpened = useCallback(
    (nextOpened: boolean) => {
      if (!nextOpened) {
        handleClose();
        return;
      }

      setOpened(nextOpened);
    },
    [handleClose, setOpened],
  );

  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const values = getValues();

    try {
      const game = await createGame.mutateAsync({
        studioId: activeStudio.id,
        title: values.title,
        slug: values.slug,
      });

      const hasSteamUrl = isSteamStoreUrl(values.steamUrl);
      if (hasSteamUrl) {
        try {
          await importFromSteamWithPost({
            gameId: game.id,
            steamUrl: values.steamUrl.trim(),
          });
        } catch {
          // Non-fatal: the game exists even if Steam import fails.
        }
      }

      const validLinks = values.links.filter((link) => {
        const normalizedUrl = normalizeUrlForComparison(link.url);
        const importedBySteam = hasSteamUrl && steamPreview?.suggestedLinks?.some(
          (suggestedLink) =>
            normalizeUrlForComparison(suggestedLink.url) === normalizedUrl,
        );

        return (
          link.type
          && link.url.trim()
          && isValidUrl(link.url)
          && !importedBySteam
        );
      });

      for (const [position, link] of validLinks.entries()) {
        try {
          await createLink.mutateAsync({
            gameId: game.id,
            type: link.type as any,
            category: (TYPE_TO_CATEGORY[link.type] || 'other') as any,
            label: TYPE_TO_LABEL[link.type] || link.type,
            url: link.url.trim(),
            position,
          });
        } catch {
          // Non-fatal: continue creating remaining links.
        }
      }

      utils.game.list.invalidate({studioId: activeStudio.id});
      utils.game.get.invalidate();
      showSnackbar({message: `${values.title} created`, severity: 'success'});

      handleClose();
      navigate(`/${activeStudio.slug}/games/${game.id}`);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeStudio.id,
    activeStudio.slug,
    createGame,
    createLink,
    getValues,
    handleClose,
    navigate,
    showSnackbar,
    steamPreview?.suggestedLinks,
    utils.game.get,
    utils.game.list,
  ]);

  const handleSlugInputChange = useCallback(
    (value: string, onChange: (value: string) => void) => {
      setSlugTouched(true);
      onChange(sanitizeSlugInput(value));
    },
    [],
  );

  const handleLinkUrlChange = useCallback(
    (index: number, value: string, onChange: (value: string) => void) => {
      onChange(value);

      const detectedType = detectTypeFromUrl(value);
      const currentType = getValues(`links.${index}.type` as const);

      if (detectedType && !currentType) {
        setValue(`links.${index}.type` as const, detectedType);
      }
    },
    [getValues, setValue],
  );

  const handleAddLink = useCallback(() => {
    lastAddedIndexRef.current = fields.length;
    append({type: '', url: ''});
  }, [append, fields.length]);

  const handleSkipImport = useCallback(() => {
    setValue('steamUrl', '');
    setStep('links');
  }, [setValue]);

  const setUrlInputRef = useCallback((index: number, element: HTMLInputElement | null) => {
    urlInputRefs.current[index] = element;
  }, []);

  const isSlugValid
    = slug.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const isSlugCheckInProgress
    = isSlugValid && (slug !== debouncedSlug || isFetchingSlugCheck);
  const isSlugAvailable = !isSlugCheckInProgress && slugCheck?.available === true;
  const isSlugUnavailable = !isSlugCheckInProgress && slugCheck?.available === false;
  const requiresSlugVerification
    = isSlugAvailable && slugCheck?.requiresVerification === true;
  const canProceedStep1 = title.length > 0 && isSlugValid && isSlugAvailable;
  const canProceedImportStep = !!steamPreview && !isFetchingSteamPreview;
  const steamPreviewErrorMessage =
    isDebouncedSteamUrlValid && steamPreviewError
      ? steamPreviewError.message
      : null;
  const isDismissable = step === 'create' && !isSubmitting;

  return {
    canProceedStep1,
    canProceedImportStep,
    control,
    fields,
    handleAddLink,
    handleClose,
    handleFinalSubmit,
    handleLinkUrlChange,
    handleSkipImport,
    handleSlugInputChange,
    isCheckingSlug: isSlugCheckInProgress,
    isDismissable,
    isSlugAvailable,
    isSlugUnavailable,
    requiresSlugVerification,
    isFetchingSteamPreview,
    isSteamUrlValid,
    isSubmitting,
    remove,
    setDialogOpened,
    setStep,
    setUrlInputRef,
    slug,
    steamPreview,
    steamPreviewErrorMessage,
    step,
    submitError,
    title,
  };
}
