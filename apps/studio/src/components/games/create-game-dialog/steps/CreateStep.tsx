import {CheckCircle2Icon, Loader2Icon, XIcon} from 'lucide-react';
import type {Control} from 'react-hook-form';
import {
  Button,
  DialogOverlay,
  FieldsetController,
  Icon,
  Input,
  InputAdornment,
} from '@play/pylon';
import {
  AvailableText,
  Form,
  SlugPrefix,
  SlugStatus,
  StatusIcon,
  Subtitle,
  UnavailableText,
  VerificationRequiredText,
} from '../styles';
import type {FormValues} from '../types';

interface CreateStepProps {
  control: Control<FormValues>;
  slug: string;
  canProceed: boolean;
  isCheckingSlug: boolean;
  isSlugAvailable: boolean;
  isSlugUnavailable: boolean;
  requiresSlugVerification: boolean;
  onCancel: () => void;
  onContinue: () => void;
  onSlugInputChange: (value: string, onChange: (value: string) => void) => void;
}

export function CreateStep({
  control,
  slug,
  canProceed,
  isCheckingSlug,
  isSlugAvailable,
  isSlugUnavailable,
  requiresSlugVerification,
  onCancel,
  onContinue,
  onSlugInputChange,
}: CreateStepProps) {
  const slugHelpText =
    slug.length < 3 ? (
      'Lowercase, numbers, hyphens. Min 3 chars.'
    ) : isCheckingSlug ? (
      'Checking availability...'
    ) : isSlugAvailable ? (
      requiresSlugVerification ? (
        <VerificationRequiredText>
          This slug is available but protected. You can create it, but
          admin verification is required before publishing.
        </VerificationRequiredText>
      ) : (
        <AvailableText>This slug is available!</AvailableText>
      )
    ) : isSlugUnavailable ? (
      <UnavailableText>This slug is already taken.</UnavailableText>
    ) : (
      'Checking availability...'
    );

  return (
    <>
      <DialogOverlay.Header showCloseButton>Create game</DialogOverlay.Header>
      <DialogOverlay.Content>
        <Subtitle>Create a play.link page for your game.</Subtitle>

        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (canProceed) onContinue();
          }}
          id="create-game-form"
        >
          <FieldsetController
            control={control}
            name="title"
            rules={{required: 'Title is required'}}
            fieldsetProps={{label: 'Game title'}}
            render={({controlledProps}) => (
              <Input
                {...controlledProps}
                placeholder="My Awesome Game"
                size="lg"
                className="w-full"
              />
            )}
          />

          <FieldsetController
            control={control}
            name="slug"
            fieldsetProps={{label: 'URL slug', helpText: slugHelpText}}
            render={({controlledProps}) => (
              <InputAdornment
                leftAdornment={<SlugPrefix>play.link/</SlugPrefix>}
                rightAdornment={
                  slug.length >= 3 ? (
                    <SlugStatus>
                      {isCheckingSlug ? (
                        <StatusIcon $status="loading">
                          <Icon icon={Loader2Icon} />
                        </StatusIcon>
                      ) : isSlugAvailable ? (
                        <StatusIcon $status="available">
                          <Icon icon={CheckCircle2Icon} />
                        </StatusIcon>
                      ) : isSlugUnavailable ? (
                        <StatusIcon $status="unavailable">
                          <Icon icon={XIcon} />
                        </StatusIcon>
                      ) : null}
                    </SlugStatus>
                  ) : undefined
                }
              >
                <Input
                  value={controlledProps.value}
                  onChange={(e) =>
                    onSlugInputChange(e.target.value, controlledProps.onChange)
                  }
                  onBlur={controlledProps.onBlur}
                  ref={controlledProps.ref}
                  placeholder="my-awesome-game"
                  size="lg"
                  name={controlledProps.name}
                  invalid={controlledProps.invalid}
                />
              </InputAdornment>
            )}
          />
        </Form>
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="mr-auto"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-game-form"
          variant="primary"
          disabled={!canProceed}
        >
          Continue
        </Button>
      </DialogOverlay.Footer>
    </>
  );
}
