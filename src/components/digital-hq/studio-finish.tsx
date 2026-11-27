"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

// The HTML city plate sits behind a transparent canvas. Composite the bright
// pixels with their own alpha so empty sky and HTML labels stay untouched.
export function StudioFinish() {
  const { gl, size, viewport } = useThree();
  const pass = useMemo(() => {
    const target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 2 });
    target.depthTexture = new T.DepthTexture(1, 1, T.UnsignedIntType);
    const material = new T.ShaderMaterial({
      uniforms: {
        colorMap: { value: target.texture }, depthMap: { value: target.depthTexture },
        texel: { value: new T.Vector2() }, clip: { value: new T.Vector2(.1, 100) },
      },
      depthWrite: false, depthTest: false, blending: T.NoBlending,
      vertexShader: "varying vec2 uv0; void main(){ uv0=uv; gl_Position=vec4(position.xy,0.,1.); }",
      fragmentShader: `
        varying vec2 uv0;
        uniform sampler2D colorMap, depthMap;
        uniform vec2 texel, clip;
        float distanceAt(vec2 uv) {
          float d = texture2D(depthMap, uv).r;
          return clip.x * clip.y / (clip.y - d * (clip.y - clip.x));
        }
        void main() {
          vec4 base = texture2D(colorMap, uv0);
          vec3 halo = vec3(0.);
          float center = distanceAt(uv0), contact = 0.;
          for (int i=0; i<8; i++) {
            float a = (float(i)+.5)*.78539816;
            vec2 direction = vec2(cos(a),sin(a))*texel;
            vec3 sampleColor = texture2D(colorMap, uv0 + direction*4.).rgb;
            float peak = max(max(sampleColor.r,sampleColor.g), sampleColor.b);
            halo += sampleColor * smoothstep(1.2,3.2,peak);
            float delta = center - distanceAt(uv0 + direction*3.);
            contact += smoothstep(.012,.09,delta)*(1.-smoothstep(.14,.55,delta));
          }
          halo *= .021;
          gl_FragColor = vec4(base.rgb*(1.-contact*.026)+halo, max(base.a, clamp(max(halo.r,max(halo.g,halo.b)),0.,1.)));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    return { target, material, quad: new FullScreenQuad(material) };
  }, []);
  useEffect(() => {
    const ratio = gl.getPixelRatio(), width = Math.max(1, Math.round(size.width * ratio)), height = Math.max(1, Math.round(size.height * ratio));
    pass.target.setSize(width, height);
    pass.material.uniforms.texel.value.set(ratio / width, ratio / height);
  }, [gl, pass, size.width, size.height, viewport.dpr]);
  useEffect(() => () => { pass.target.dispose(); pass.material.dispose(); pass.quad.dispose(); }, [pass]);
  useFrame(({ scene, camera }) => {
    const previousTarget = gl.getRenderTarget();
    gl.setRenderTarget(pass.target);
    gl.render(scene, camera);
    gl.setRenderTarget(previousTarget);
    pass.quad.render(gl);
  }, 1);
  return null;
}
