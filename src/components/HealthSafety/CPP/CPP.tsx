import React from 'react';
import { CPPsubpage } from './CPPsubpage';

interface CPPProps {
  onBack: () => void;
}

export function CPP({ onBack }: CPPProps) {
  return <CPPsubpage onBack={onBack} />;
}