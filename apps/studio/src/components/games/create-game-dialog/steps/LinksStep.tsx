import {ArrowLeftIcon, PlusIcon, XIcon} from 'lucide-react';
import {Controller, useWatch} from 'react-hook-form';
import type {Control, FieldArrayWithId} from 'react-hook-form';
import {Button, DialogOverlay, Icon, IconButton, Input, Select} from '@play/pylon';
import {LINK_OPTIONS} from '../constants';
import {
  AddLinkWrapper,
  EmptyLinksState,
  ErrorMessage,
  FooterSpacer,
  LinkItem,
  LinkRow,
  LinkRowHint,
  LinksBuilder,
  LinkSelectCell,
  LinksFooterNote,
  LinksHeader,
  LinksHint,
  LinksList,
  LinkUrlCell,
  Subtitle,
} from '../styles';
import type {FormValues} from '../types';
import {isValidUrl} from '../utils';

interface LinksStepProps {
  control: Control<FormValues>;
  fields: FieldArrayWithId<FormValues, 'links', 'id'>[];
  title: string;
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
  onCreateGame: () => void;
  onLinkUrlChange: (
    index: number,
    value: string,
    onChange: (value: string) => void,
  ) => void;
  setUrlInputRef: (index: number, element: HTMLInputElement | null) => void;
}

export function LinksStep({
  control,
  fields,
  title,
  isSubmitting,
  submitError,
  onBack,
  onAddLink,
  onRemoveLink,
  onCreateGame,
  onLinkUrlChange,
  setUrlInputRef,
}: LinksStepProps) {
  const watchedLinks = useWatch({control, name: 'links'}) || [];
  const validLinksCount = watchedLinks.filter(
    (link) =>
      !!link?.type &&
      !!link?.url?.trim() &&
      isValidUrl(link.url),
  ).length;
  const invalidLinksCount = watchedLinks.filter(
    (link) =>
      !!link?.url?.trim() &&
      !isValidUrl(link.url),
  ).length;
  const hasInvalidLinks = invalidLinksCount > 0;

  return (
    <>
      <DialogOverlay.Header showCloseButton>Add links</DialogOverlay.Header>
      <DialogOverlay.Content>
        <Subtitle>
          Where can people find <strong>{title}</strong>?
        </Subtitle>

        <LinksBuilder>
          <LinksHeader>
            <LinksHint>Add store, social, and website links for your page.</LinksHint>
            <LinksHint>
              {validLinksCount} valid
              {invalidLinksCount > 0 ? ` · ${invalidLinksCount} invalid` : ''}
            </LinksHint>
          </LinksHeader>
          {fields.length > 0 ? (
            <LinksList>
              {fields.map((field, index) => {
                const row = watchedLinks[index];
                const hasType = !!row?.type;
                const hasUrl = !!row?.url?.trim();
                const urlInvalid = hasUrl && !isValidUrl(row.url);

                return (
                  <LinkItem key={field.id}>
                    <LinkRow>
                      <LinkSelectCell>
                        <Controller
                          control={control}
                          name={`links.${index}.type`}
                          render={({field: typeField}) => (
                            <Select
                              size="sm"
                              fullWidth
                              value={typeField.value}
                              placeholder="Select platform..."
                              options={LINK_OPTIONS}
                              onChange={(e) =>
                                typeField.onChange(
                                  (e.target as HTMLSelectElement).value,
                                )
                              }
                            />
                          )}
                        />
                      </LinkSelectCell>
                      <LinkUrlCell>
                        <Controller
                          control={control}
                          name={`links.${index}.url`}
                          render={({field: urlField}) => {
                            const currentUrlInvalid =
                              urlField.value.trim().length > 0 &&
                              !isValidUrl(urlField.value);

                            return (
                              <Input
                                ref={(element) => {
                                  urlField.ref(element);
                                  setUrlInputRef(index, element);
                                }}
                                type="text"
                                size="sm"
                                value={urlField.value}
                                onChange={(e) =>
                                  onLinkUrlChange(
                                    index,
                                    e.target.value,
                                    urlField.onChange,
                                  )
                                }
                                onBlur={urlField.onBlur}
                                placeholder="https://..."
                                className={currentUrlInvalid ? 'invalid' : ''}
                              />
                            );
                          }}
                        />
                      </LinkUrlCell>
                      <IconButton
                        type="button"
                        icon={XIcon}
                        size="sm"
                        variant="muted"
                        aria-label="Remove link"
                        onClick={() => onRemoveLink(index)}
                      />
                    </LinkRow>
                    {urlInvalid ? (
                      <LinkRowHint $error>
                        Enter a valid URL including https://.
                      </LinkRowHint>
                    ) : hasType && !hasUrl ? (
                      <LinkRowHint>
                        Add a destination URL for this link type.
                      </LinkRowHint>
                    ) : !hasType && hasUrl ? (
                      <LinkRowHint>
                        Select a link type for this destination.
                      </LinkRowHint>
                    ) : null}
                  </LinkItem>
                );
              })}
            </LinksList>
          ) : (
            <EmptyLinksState>No links yet. Add one to get started.</EmptyLinksState>
          )}

          <AddLinkWrapper>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddLink}
            >
              <Icon icon={PlusIcon} size={14} className="mr-1" />
              Add link
            </Button>
          </AddLinkWrapper>
        </LinksBuilder>

        {submitError && (
          <ErrorMessage className="mt-4">{submitError}</ErrorMessage>
        )}
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <Icon icon={ArrowLeftIcon} size={16} />
          Back
        </Button>
        {hasInvalidLinks && (
          <LinksFooterNote>
            Fix invalid links before creating the game.
          </LinksFooterNote>
        )}
        <FooterSpacer />
        <Button
          type="button"
          variant="primary"
          onClick={onCreateGame}
          disabled={isSubmitting || hasInvalidLinks}
        >
          {isSubmitting ? 'Creating...' : 'Create game'}
        </Button>
      </DialogOverlay.Footer>
    </>
  );
}
