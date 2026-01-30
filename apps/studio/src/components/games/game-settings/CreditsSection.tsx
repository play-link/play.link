import {PlusIcon, TrashIcon} from 'lucide-react';
import {useState} from 'react';
import type {CreditRoleType} from '@play/supabase-client';
import styled from 'styled-components';
import {Button, Fieldset, Input, Select, useSnackbar} from '@play/pylon';
import {trpc} from '@/lib/trpc';
import {Section, SectionTitle} from './shared';

const CREDIT_ROLE_OPTIONS = [
  {label: 'Developer', value: 'DEVELOPER'},
  {label: 'Publisher', value: 'PUBLISHER'},
  {label: 'Porting', value: 'PORTING'},
  {label: 'Marketing', value: 'MARKETING'},
  {label: 'Support', value: 'SUPPORT'},
];

interface CreditsSectionProps {
  gameId: string;
}

export function CreditsSection({gameId}: CreditsSectionProps) {
  const {showSnackbar} = useSnackbar();
  const [adding, setAdding] = useState(false);
  const [newRole, setNewRole] = useState<CreditRoleType>('DEVELOPER');
  const [newCustomName, setNewCustomName] = useState('');

  const utils = trpc.useUtils();
  const {data: credits = []} = trpc.gameCredit.list.useQuery({gameId});

  const createCredit = trpc.gameCredit.create.useMutation({
    onSuccess: () => {
      utils.gameCredit.list.invalidate({gameId});
      setAdding(false);
      setNewCustomName('');
      setNewRole('DEVELOPER');
      showSnackbar({message: 'Credit added', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const deleteCredit = trpc.gameCredit.delete.useMutation({
    onSuccess: () => {
      utils.gameCredit.list.invalidate({gameId});
      showSnackbar({message: 'Credit removed', severity: 'success'});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleAdd = () => {
    if (!newCustomName.trim()) return;
    createCredit.mutate({
      gameId,
      customName: newCustomName.trim(),
      role: newRole,
    });
  };

  return (
    <Section>
      <SectionTitle>Credits</SectionTitle>

      {credits.length > 0 && (
        <CreditList>
          {credits.map((credit) => (
            <CreditRow key={credit.id}>
              <CreditInfo>
                <CreditName>
                  {credit.organizations?.name || credit.custom_name}
                </CreditName>
                <CreditRoleBadge>{credit.role.toLowerCase()}</CreditRoleBadge>
              </CreditInfo>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => deleteCredit.mutate({id: credit.id})}
                disabled={deleteCredit.isPending}
              >
                <TrashIcon size={14} />
              </Button>
            </CreditRow>
          ))}
        </CreditList>
      )}

      {adding ? (
        <AddCreditForm>
          <Fieldset label="Name">
            <Input
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              placeholder="Studio or person name"
              size="sm"
            />
          </Fieldset>
          <Fieldset label="Role">
            <Select
              options={CREDIT_ROLE_OPTIONS}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as CreditRoleType)}
              size="sm"
            />
          </Fieldset>
          <AddCreditActions>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              disabled={!newCustomName.trim() || createCredit.isPending}
            >
              Add
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </AddCreditActions>
        </AddCreditForm>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
          <PlusIcon size={16} />
          Add credit
        </Button>
      )}
    </Section>
  );
}

const CreditList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const CreditRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-muted);
  border-radius: var(--radius-lg);
`;

const CreditInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const CreditName = styled.span`
  font-size: var(--text-sm);
  color: var(--fg);
  font-weight: var(--font-weight-medium);
`;

const CreditRoleBadge = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-muted);
  background: var(--bg-surface);
  padding: var(--spacing-0-5) var(--spacing-2);
  border-radius: var(--radius-md);
`;

const AddCreditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--bg-muted);
  border-radius: var(--radius-lg);
`;

const AddCreditActions = styled.div`
  display: flex;
  gap: var(--spacing-2);
`;
