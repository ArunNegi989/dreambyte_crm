"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "@/public/assets/styles/homepageloader/Loader.module.css";
import logo from "@/public/assets/images/logo.png";

const SUBS = [
  "Stretching and yawning...",
  "Fetching your data...",
  "Almost at the door...",
];
const STATS = ["LOADING", "PROCESSING", "VERIFYING", "READY"];

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [labelIdx, setLabelIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Paw print spawner
  useEffect(() => {
    const trail = document.getElementById("pawTrail")!;
    const W = window.innerWidth;
    const H = window.innerHeight;

const pawData = [
  // Left side
  { x: W * 0.07,  y: H * 0.92, r: 160 },
  { x: W * 0.055, y: H * 0.80, r: 170 },
  { x: W * 0.08,  y: H * 0.68, r: 155 },
  { x: W * 0.06,  y: H * 0.56, r: 165 },
  { x: W * 0.09,  y: H * 0.44, r: 160 },
  { x: W * 0.055, y: H * 0.32, r: 170 },
  { x: W * 0.08,  y: H * 0.20, r: 155 },
  { x: W * 0.06,  y: H * 0.10, r: 165 },
  // Right side
  { x: W * 0.89,  y: H * 0.92, r: -160 },
  { x: W * 0.91,  y: H * 0.80, r: -170 },
  { x: W * 0.87,  y: H * 0.68, r: -155 },
  { x: W * 0.92,  y: H * 0.56, r: -165 },
  { x: W * 0.88,  y: H * 0.44, r: -160 },
  { x: W * 0.91,  y: H * 0.32, r: -170 },
  { x: W * 0.87,  y: H * 0.20, r: -155 },
  { x: W * 0.90,  y: H * 0.10, r: -165 },
];
    pawData.forEach((p, i) => {
      const el = document.createElement("div");
      el.className = styles.paw;
      el.style.cssText = `left:${p.x - 14}px;top:${p.y - 17}px;transform:rotate(${p.r}deg);animation-delay:${i * 0.18}s`;
      el.innerHTML = `
        <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
          <ellipse cx="14" cy="24" rx="8" ry="9" fill="rgba(0,0,0,0.10)"/>
          <ellipse cx="5" cy="13" rx="4" ry="5" fill="rgba(0,0,0,0.08)"/>
          <ellipse cx="23" cy="13" rx="4" ry="5" fill="rgba(0,0,0,0.08)"/>
          <ellipse cx="10" cy="7" rx="3.5" ry="4.5" fill="rgba(0,0,0,0.07)"/>
          <ellipse cx="20" cy="6" rx="3" ry="4" fill="rgba(0,0,0,0.07)"/>
        </svg>`;
      trail.appendChild(el);
    });

    return () => { trail.innerHTML = ""; };
  }, []);

  // Progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + Math.random() * 3 + 0.8, 100);
        if (next > 25 && prev <= 25) setLabelIdx(1);
        else if (next > 55 && prev <= 55) setLabelIdx(2);
        else if (next > 82 && prev <= 82) setLabelIdx(3);
        if (next >= 100) {
          clearInterval(interval);
          setDone(true);
          setTimeout(() => router.push("/auth/login"), 1000);
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <main className={styles.wrapper}>
      <div className={styles.bgDots} />
      <div className={styles.pawTrail} id="pawTrail" />

      <div className={styles.center}>

        {/* ── Orbit + Logo ── */}
        <div className={styles.orbitWrap}>
          <div className={styles.pulseA} />
          <div className={styles.pulseB} />

          <div className={styles.hexRing}>
            <div className={styles.tick} />
            <div className={styles.tick2} />
            <div className={styles.tick3} />
            <div className={styles.tick4} />
          </div>
          <div className={styles.midRing}>
            <div className={styles.mtick} />
          </div>
          <div className={styles.innerRing} />

          <div className={styles.logoShell}>
            <Image
              src={logo}
              alt="DreamByte"
              width={206}
              height={206}
              className={styles.logoImg}
              priority
            />
          </div>
        </div>

        {/* ── Brand ── */}
        <div className={styles.brandRow}>
          <span className={styles.brand}>DreamByte</span>
          <span className={styles.brandTag}>CRM</span>
        </div>
        <p className={styles.taglineMain}>Your workspace is waking up</p>
        

        {/* ── Progress bar ── */}
        <div className={styles.barShell}>
          <div className={styles.barTop}>
            <span className={styles.barStatus}>{STATS[labelIdx]}</span>
            <span className={styles.barNum}>{Math.floor(progress)}%</span>
          </div>
          <div className={styles.barOuter}>
            <div className={styles.barInner} style={{ width: `${progress}%` }}>
              <div className={styles.barShine} />
            </div>
            <div
              className={styles.barCat}
              style={{ left: `calc(${progress}% - 10px)` }}
            >
              🐾
            </div>
          </div>
        </div>

        {/* ── Step dots ── */}
        <div className={styles.stepRow}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <div
                className={`${styles.stepDot} ${
                  i < labelIdx
                    ? styles.stepDone
                    : i === labelIdx
                    ? styles.stepActive
                    : ""
                }`}
              />
              {i < 3 && (
                <div
                  className={`${styles.stepLine} ${
                    i < labelIdx ? styles.stepLineDone : ""
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <p className={`${styles.funText} ${done ? styles.funTextShow : ""}`}>
          Redirecting to your workspace...
        </p>
      </div>
    </main>
  );
}