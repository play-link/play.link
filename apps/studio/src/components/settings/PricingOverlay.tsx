import {CheckIcon, SparklesIcon, XIcon, ZapIcon} from 'lucide-react';
import {useState} from 'react';
import {Button, DialogOverlay, SegmentedControls} from '@play/pylon';

interface PricingOverlayProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}

const MONTHLY_PRICE = 19;
const YEARLY_MONTHLY_PRICE = 17; // ~10% off

const FREE_FEATURES = [
  'Unlimited game pages',
  'Playlink URLs',
  'Game page editor',
  'Studio profile page',
  'Collect subscribers',
  'Basic analytics',
  'Tip Jar (10% fee)',
  'Playlink branding',
];

const PRO_FEATURES = [
  'Remove Playlink branding',
  'Custom domains',
  'Unlimited email updates to subscribers',
  'Audience segmentation & filters',
  'Unlimited campaigns',
  'Advanced analytics',
  'Custom themes per game',
  'Earn more from tips (5% fee)',
  'Priority support',
];

export function PricingOverlay({opened, setOpened}: PricingOverlayProps) {
  const [billing, setBilling] = useState('monthly');

  const price = billing === 'yearly' ? YEARLY_MONTHLY_PRICE : MONTHLY_PRICE;
  const yearlyTotal = YEARLY_MONTHLY_PRICE * 12;

  return (
    <DialogOverlay opened={opened} setOpened={setOpened} size="full">
      <div className="flex flex-col items-center min-h-full px-4 py-12">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setOpened(false)}
          className="absolute top-4 right-4 p-2 rounded-lg border-0 cursor-pointer text-(--fg-muted) hover:text-(--fg-default) bg-transparent transition-colors"
        >
          <XIcon size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose your plan</h1>
          <p className="text-(--fg-muted) text-base">
            Start free, upgrade when you're ready.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10">
          <SegmentedControls
            value={billing}
            onChange={(item) => setBilling(item.value)}
            items={[
              {label: 'Monthly', value: 'monthly'},
              {label: 'Yearly (save 10%)', value: 'yearly'},
            ]}
          />
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Free Plan */}
          <div className="rounded-xl border border-(--border-muted) p-6 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <ZapIcon size={18} className="text-(--fg-muted)" />
                <h2 className="text-xl font-bold">Free</h2>
              </div>
              <p className="text-sm text-(--fg-muted)">For getting started.</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-(--fg-muted) text-sm ml-1">/month</span>
            </div>

            <Button variant="ghost" className="w-full mb-6" disabled>
              Current plan
            </Button>

            <div className="flex flex-col gap-3">
              {FREE_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5">
                  <CheckIcon size={16} className="text-(--fg-muted) shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl border-2 border-(--accent) p-6 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <SparklesIcon size={18} className="text-(--accent)" />
                <h2 className="text-xl font-bold">Pro</h2>
                <span className="bg-(--accent) text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-(--fg-muted)">For developers growing an audience.</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">${price}</span>
              <span className="text-(--fg-muted) text-sm ml-1">/month</span>
              {billing === 'yearly' && (
                <span className="text-(--fg-muted) text-xs ml-2">
                  (${yearlyTotal}/year)
                </span>
              )}
            </div>

            <Button variant="primary" className="w-full mb-6">
              Upgrade to Pro
            </Button>

            <p className="text-xs text-(--fg-muted) mb-4">Everything in Free, plus:</p>
            <div className="flex flex-col gap-3">
              {PRO_FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5">
                  <CheckIcon size={16} className="text-(--accent) shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DialogOverlay>
  );
}
