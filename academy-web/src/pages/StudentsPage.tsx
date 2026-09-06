import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademy } from '../context/AcademyContext';
import { WebStudents } from '../components/WebStudents';
import { WebStudent, WebFamily } from '../types';

export const StudentsPage: React.FC = () => {
  const {
    students,
    groups,
    families,
    charges,
    payments,
    customerCredits,
    invoices,
    handleAddFamily,
    handleUpdateFamily,
    handleAddStudent,
    setPreselectedStudent,
    setPreselectedFamily,
    subscription,
    setIsSubscriptionModalOpen,
  } = useAcademy();

  const navigate = useNavigate();

  const handleQuickPay = (student: WebStudent) => {
    setPreselectedStudent(student);
    setPreselectedFamily(null);
    navigate('/cashier');
  };

  const handleQuickPayFamily = (family: WebFamily) => {
    setPreselectedFamily(family);
    setPreselectedStudent(null);
    navigate('/cashier');
  };

  return (
    <WebStudents
      students={students}
      groups={groups}
      families={families}
      charges={charges}
      payments={payments}
      customerCredits={customerCredits}
      invoices={invoices}
      onAddFamily={handleAddFamily}
      onUpdateFamily={handleUpdateFamily}
      onAddStudent={handleAddStudent}
      onQuickPay={handleQuickPay}
      onQuickPayFamily={handleQuickPayFamily}
      subscription={subscription}
      onOpenPlansModal={() => setIsSubscriptionModalOpen(true)}
    />
  );
};
