import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import { WebCashier } from '../components/WebCashier';

export const CashierPage: React.FC = () => {
  const {
    charges,
    payments,
    students,
    families,
    preselectedStudent,
    preselectedFamily,
    setPreselectedStudent,
    setPreselectedFamily,
    invoices,
    activeAcademy,
    customerCredits,
    refunds,
    packages,
    packageCredits,
    trials,
    promotions,
    handleRegisterPayment,
    handleEmitInvoiceForPayment,
    handleAddCustomerCredit,
    handleApplyCustomerCredit,
    handleAddRefund,
    handleAddPackageCredit,
    handleConsumePackageCredit,
    handleAddPackage,
    handleAddPromotion,
    handleConvertTrial,
  } = useAcademy();

  return (
    <WebCashier
      charges={charges}
      payments={payments}
      students={students}
      families={families}
      preselectedStudent={preselectedStudent}
      preselectedFamily={preselectedFamily}
      onClearPreselectedStudent={() => setPreselectedStudent(null)}
      onClearPreselectedFamily={() => setPreselectedFamily(null)}
      invoices={invoices}
      academyProfile={activeAcademy}
      customerCredits={customerCredits}
      refunds={refunds}
      packages={packages}
      packageCredits={packageCredits}
      trials={trials}
      promotions={promotions}
      onAddPayment={handleRegisterPayment}
      onEmitInvoiceForPayment={handleEmitInvoiceForPayment}
      onAddCustomerCredit={handleAddCustomerCredit}
      onApplyCustomerCredit={handleApplyCustomerCredit}
      onAddRefund={handleAddRefund}
      onAddPackageCredit={handleAddPackageCredit}
      onConsumePackageCredit={handleConsumePackageCredit}
      onAddPackage={handleAddPackage}
      onAddPromotion={handleAddPromotion}
      onConvertTrial={handleConvertTrial}
    />
  );
};
