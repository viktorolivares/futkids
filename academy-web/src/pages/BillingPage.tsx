import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import { WebBilling } from '../components/WebBilling';

export const BillingPage: React.FC = () => {
  const {
    invoices,
    setInvoices,
    students,
    activeAcademy,
    subscription,
    setIsSubscriptionModalOpen,
  } = useAcademy();

  return (
    <WebBilling
      invoices={invoices}
      onAddInvoice={(newInv) => setInvoices((prev) => [newInv, ...prev])}
      students={students}
      academyProfile={activeAcademy}
      subscription={subscription}
      onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
    />
  );
};
