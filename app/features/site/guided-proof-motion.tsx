"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface GuidedProofMotionProps {
  children: ReactNode;
}

export function GuidedProofMotion({ children }: GuidedProofMotionProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;

      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-proof-media]").forEach((item) => {
          gsap.fromTo(
            item,
            { opacity: 0.56, scale: 0.955 },
            {
              opacity: 1,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: item,
                start: "top 90%",
                end: "center 52%",
                scrub: 0.6,
              },
            },
          );
        });

        gsap.utils
          .toArray<HTMLElement>("[data-reveal-line]")
          .forEach((line) => {
            const words = line.querySelectorAll("[data-reveal-word]");

            gsap.fromTo(
              words,
              { opacity: 0.22, y: 8 },
              {
                opacity: 1,
                y: 0,
                stagger: 0.07,
                ease: "none",
                scrollTrigger: {
                  trigger: line,
                  start: "top 82%",
                  end: "bottom 46%",
                  scrub: 0.55,
                },
              },
            );
          });
      });

      return () => media.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
