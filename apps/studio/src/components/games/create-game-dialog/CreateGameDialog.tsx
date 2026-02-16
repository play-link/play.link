import {DialogOverlay} from '@play/pylon';
import {CreateStep, ImportStep, LinksStep} from './steps';
import type {CreateGameDialogProps} from './types';
import {useCreateGameDialogFlow} from './useCreateGameDialogFlow';

export function CreateGameDialog({opened, setOpened}: CreateGameDialogProps) {
  const {
    canProceedStep1,
    canProceedImportStep,
    control,
    fields,
    handleClose,
    handleAddLink,
    handleFinalSubmit,
    handleLinkUrlChange,
    handleSkipImport,
    handleSlugInputChange,
    isCheckingSlug,
    isDismissable,
    isFetchingSteamPreview,
    isSlugAvailable,
    isSlugUnavailable,
    requiresSlugVerification,
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
  } = useCreateGameDialogFlow({setOpened});

  return (
    <DialogOverlay
      opened={opened}
      setOpened={setDialogOpened}
      size="md"
      cancelOnOutsideClick={isDismissable}
      cancelOnEscKey={isDismissable}
      style={{minHeight: 420}}
    >
      {step === 'create' && (
        <CreateStep
          control={control}
          slug={slug}
          canProceed={canProceedStep1}
          isCheckingSlug={isCheckingSlug}
          isSlugAvailable={isSlugAvailable}
          isSlugUnavailable={isSlugUnavailable}
          requiresSlugVerification={requiresSlugVerification}
          onCancel={handleClose}
          onContinue={() => setStep('import')}
          onSlugInputChange={handleSlugInputChange}
        />
      )}

      {step === 'import' && (
        <ImportStep
          control={control}
          title={title}
          canProceed={canProceedImportStep}
          isCheckingPreview={isFetchingSteamPreview}
          hasValidSteamUrl={isSteamUrlValid}
          steamPreview={steamPreview}
          previewError={steamPreviewErrorMessage}
          onBack={() => setStep('create')}
          onSkip={handleSkipImport}
          onNext={() => setStep('links')}
        />
      )}

      {step === 'links' && (
        <LinksStep
          control={control}
          fields={fields}
          title={title}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onBack={() => setStep('import')}
          onAddLink={handleAddLink}
          onRemoveLink={remove}
          onCreateGame={handleFinalSubmit}
          onLinkUrlChange={handleLinkUrlChange}
          setUrlInputRef={setUrlInputRef}
        />
      )}
    </DialogOverlay>
  );
}
