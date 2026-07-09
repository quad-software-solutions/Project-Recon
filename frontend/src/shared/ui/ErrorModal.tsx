import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  message,
  onClose,
  title = 'Error',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center p-6 text-center space-y-4" style={{ zIndex: 9999 }}>
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{message}</p>
        <div className="pt-4 w-full flex justify-center">
          <Button onClick={onClose} variant="primary" className="w-full sm:w-auto px-8">
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );
};
