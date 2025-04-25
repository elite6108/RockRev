// Custom type declarations for React JSX runtime
declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
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
