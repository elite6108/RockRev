declare module 'lucide-react' {
  import React from 'react';

  export interface IconProps extends React.SVGAttributes<SVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type Icon = React.FC<IconProps>;

  export const AlertTriangle: Icon;
  export const ArrowRight: Icon;
  export const Calendar: Icon;
  export const Edit: Icon;
  export const FileText: Icon;
  export const Loader2: Icon;
  export const Plus: Icon;
  export const Save: Icon;
  export const Search: Icon;
  export const Trash2: Icon;
  export const X: Icon;
} 