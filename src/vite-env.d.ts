/// <reference types="vite/client" />

// Add React JSX runtime type definitions
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// SVG element type definitions
declare namespace JSX {
  interface IntrinsicElements {
    svg: React.SVGProps<SVGSVGElement>;
    path: React.SVGProps<SVGPathElement>;
    line: React.SVGProps<SVGLineElement>;
    polyline: React.SVGProps<SVGPolylineElement>;
    circle: React.SVGProps<SVGCircleElement>;
    rect: React.SVGProps<SVGRectElement>;
  }
}

// React JSX runtime module declaration
declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
  }
  
  export function jsx(
    type: any,
    props: any,
    key?: string
  ): JSX.Element;
  
  export function jsxs(
    type: any,
    props: any,
    key?: string
  ): JSX.Element;
}
