import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      line: React.SVGProps<SVGLineElement>;
      polyline: React.SVGProps<SVGPolylineElement>;
      circle: React.SVGProps<SVGCircleElement>;
      rect: React.SVGProps<SVGRectElement>;
      g: React.SVGProps<SVGGElement>;
      defs: React.SVGProps<SVGDefsElement>;
      clipPath: React.SVGProps<SVGClipPathElement>;
      mask: React.SVGProps<SVGMaskElement>;
      pattern: React.SVGProps<SVGPatternElement>;
      filter: React.SVGProps<SVGFilterElement>;
      feGaussianBlur: React.SVGProps<SVGFEGaussianBlurElement>;
      feOffset: React.SVGProps<SVGFEOffsetElement>;
      feBlend: React.SVGProps<SVGFEBlendElement>;
      feColorMatrix: React.SVGProps<SVGFEColorMatrixElement>;
      feComponentTransfer: React.SVGProps<SVGFEComponentTransferElement>;
      feComposite: React.SVGProps<SVGFECompositeElement>;
      feConvolveMatrix: React.SVGProps<SVGFEConvolveMatrixElement>;
      feDiffuseLighting: React.SVGProps<SVGFEDiffuseLightingElement>;
      feDisplacementMap: React.SVGProps<SVGFEDisplacementMapElement>;
      feDistantLight: React.SVGProps<SVGFEDistantLightElement>;
      feFlood: React.SVGProps<SVGFEFloodElement>;
      feFuncA: React.SVGProps<SVGFEFuncAElement>;
      feFuncB: React.SVGProps<SVGFEFuncBElement>;
      feFuncG: React.SVGProps<SVGFEFuncGElement>;
      feFuncR: React.SVGProps<SVGFEFuncRElement>;
      feImage: React.SVGProps<SVGFEImageElement>;
      feMerge: React.SVGProps<SVGFEMergeElement>;
      feMergeNode: React.SVGProps<SVGFEMergeNodeElement>;
      feMorphology: React.SVGProps<SVGFEMorphologyElement>;
      fePointLight: React.SVGProps<SVGFEPointLightElement>;
      feSpecularLighting: React.SVGProps<SVGFESpecularLightingElement>;
      feSpotLight: React.SVGProps<SVGFESpotLightElement>;
      feTile: React.SVGProps<SVGFETileElement>;
      feTurbulence: React.SVGProps<SVGFETurbulenceElement>;
      linearGradient: React.SVGProps<SVGLinearGradientElement>;
      radialGradient: React.SVGProps<SVGRadialGradientElement>;
      stop: React.SVGProps<SVGStopElement>;
      text: React.SVGProps<SVGTextElement>;
      tspan: React.SVGProps<SVGTSpanElement>;
    }
  }
}
