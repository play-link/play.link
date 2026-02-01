import {CreditCardIcon, FileTextIcon, SparklesIcon} from 'lucide-react';
import {useState} from 'react';
import {Button, Card} from '@play/pylon';
import {PageLayout} from '@/components/layout';
import {PricingOverlay} from '@/components/settings/PricingOverlay';

export function BillingSettingsPage() {
  const [showPricing, setShowPricing] = useState(false);

  return (
    <PageLayout>
      <PageLayout.Header title="Billing" />
      <PageLayout.Content>
        <div className="flex flex-col gap-6">
          {/* Current Plan */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">Current Plan</h2>
                <p className="text-2xl font-bold">Free</p>
              </div>
              <Button variant="primary" onClick={() => setShowPricing(true)}>
                <SparklesIcon className="mr-2" size={16} />
                Upgrade
              </Button>
            </div>
          </Card>

          {/* Payment Method */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-7 rounded bg-(--accent) text-white text-xs font-bold">
                  <CreditCardIcon size={16} />
                </div>
                <span className="text-(--fg-muted) text-sm">No payment method on file</span>
              </div>
              <Button variant="ghost" size="sm">
                Add payment method
              </Button>
            </div>
          </Card>

          {/* Invoices */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Invoices</h2>
            <div className="flex flex-col items-center py-4 text-(--fg-muted)">
              <FileTextIcon size={24} className="mb-2 opacity-40" />
              <p className="text-sm">No invoices yet</p>
            </div>
          </Card>
        </div>

        <PricingOverlay opened={showPricing} setOpened={setShowPricing} />
      </PageLayout.Content>
    </PageLayout>
  );
}
