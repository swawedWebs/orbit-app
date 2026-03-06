import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { Goal } from "@shared/schema";

interface OrbitCanvasProps {
  goals: Goal[];
  onGoalClick?: (goal: Goal) => void;
  width?: number;
  height?: number;
}

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function hexToRgba(hex: string, a: number): string {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

function createGlowTexture(color: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.12, color);
  grd.addColorStop(0.45, hexToRgba(color, 0.25));
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function createParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,.8)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function playZoomSound() {
  try {
    const actx = new AudioContext();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, actx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.04, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.5);

    const osc2 = actx.createOscillator();
    const gain2 = actx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(300, actx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1400, actx.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.02, actx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(actx.destination);
    osc2.connect(gain2);
    gain2.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.5);
    osc2.start();
    osc2.stop(actx.currentTime + 0.4);
    setTimeout(() => actx.close(), 600);
  } catch {}
}

interface TrailData {
  points: THREE.Points;
  history: THREE.Vector3[];
}

interface PlanetData {
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  orbitLine: THREE.LineLoop;
  trail: TrailData;
  goal: Goal;
  angle: number;
  dist: number;
  speed: number;
  size: number;
  worldPosition: THREE.Vector3;
  hover: boolean;
}

function createTrail(color: string, trailTexture: THREE.CanvasTexture): TrailData {
  const count = 26;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color(color);

  for (let i = 0; i < count; i++) {
    const fade = 1 - i / count;
    colors[i * 3 + 0] = c.r * fade;
    colors[i * 3 + 1] = c.g * fade;
    colors[i * 3 + 2] = c.b * fade;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.42,
    map: trailTexture,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    history: Array.from({ length: count }, () => new THREE.Vector3()),
  };
}

function updateOrbitGeometry(line: THREE.LineLoop, radius: number) {
  const pts: THREE.Vector3[] = [];
  const segments = 128;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  line.geometry.dispose();
  line.geometry = new THREE.BufferGeometry().setFromPoints(pts);
}

export function OrbitCanvas({ goals, onGoalClick, width = 500, height = 500 }: OrbitCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number>(0);
  const planetsRef = useRef<PlanetData[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const sunGlowRef = useRef<THREE.Sprite | null>(null);
  const sunOuterGlowRef = useRef<THREE.Sprite | null>(null);
  const sunLightRef = useRef<THREE.PointLight | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const labelsRef = useRef<HTMLDivElement | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const trailTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const cameraStateRef = useRef({
    currentTarget: new THREE.Vector3(0, 0, 0),
    desiredTarget: new THREE.Vector3(0, 0, 0),
    currentPos: new THREE.Vector3(0, 22, 44),
    desiredPos: new THREE.Vector3(0, 22, 44),
    lookLerp: 0.085,
    posLerp: 0.08,
  });
  const trackedGoalRef = useRef<number | null>(null);
  const hoveredGoalRef = useRef<number | null>(null);

  const goalsRef = useRef(goals);
  goalsRef.current = goals;
  const onGoalClickRef = useRef(onGoalClick);
  onGoalClickRef.current = onGoalClick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setWebglFailed(true);
      return;
    }

    const gl = renderer.getContext();
    if (!gl) {
      renderer.dispose();
      setWebglFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040b, 0.0019);
    sceneRef.current = scene;

    const isMobile = width < 640;
    const camera = new THREE.PerspectiveCamera(isMobile ? 60 : 52, width / height, 0.1, 2000);
    camera.position.set(0, isMobile ? 28 : 22, isMobile ? 52 : 44);
    cameraStateRef.current.currentPos.copy(camera.position);
    cameraStateRef.current.desiredPos.copy(camera.position);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020510);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.setAttribute("data-testid", "orbit-canvas");
    rendererRef.current = renderer;

    const labelsDiv = document.createElement("div");
    labelsDiv.style.position = "absolute";
    labelsDiv.style.top = "0";
    labelsDiv.style.left = "0";
    labelsDiv.style.width = "100%";
    labelsDiv.style.height = "100%";
    labelsDiv.style.pointerEvents = "none";
    labelsDiv.style.overflow = "hidden";
    container.appendChild(labelsDiv);
    labelsRef.current = labelsDiv;

    const starCount = width < 900 ? 1200 : 2100;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 180 + Math.random() * 520;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 180;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const tint = 0.85 + Math.random() * 0.15;
      starColors[i * 3 + 0] = tint;
      starColors[i * 3 + 1] = tint;
      starColors[i * 3 + 2] = 1;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.9,
      transparent: true,
      opacity: 0.95,
      vertexColors: true,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    const ambientLight = new THREE.AmbientLight(0x6b8cff, 0.38);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2.6, 340, 2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const backLight = new THREE.PointLight(0x6b8cff, 0.9, 240, 2);
    backLight.position.set(-38, 14, -34);
    scene.add(backLight);

    const sunGroup = new THREE.Group();
    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(2.35, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xf8fbff })
    );
    sunGroup.add(sunCore);

    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture("#b7d2ff"),
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      })
    );
    sunGlow.scale.set(15.5, 15.5, 1);
    sunGroup.add(sunGlow);
    sunGlowRef.current = sunGlow;

    const sunOuterGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createGlowTexture("#6fa6ff"),
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      })
    );
    sunOuterGlow.scale.set(28, 28, 1);
    sunGroup.add(sunOuterGlow);
    sunOuterGlowRef.current = sunOuterGlow;

    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    trailTextureRef.current = createParticleTexture();

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points || obj instanceof THREE.LineLoop) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else if (mat) {
            (mat as THREE.Material).dispose();
          }
        }
        if (obj instanceof THREE.Sprite) {
          obj.material?.dispose();
          obj.material?.map?.dispose();
        }
      });

      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (labelsDiv.parentNode) {
        labelsDiv.parentNode.removeChild(labelsDiv);
      }

      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      planetsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, [width, height]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    planetsRef.current.forEach((pd) => {
      scene.remove(pd.mesh);
      scene.remove(pd.glow);
      scene.remove(pd.orbitLine);
      scene.remove(pd.trail.points);
      pd.mesh.geometry.dispose();
      (pd.mesh.material as THREE.Material).dispose();
      pd.glow.material.dispose();
      pd.glow.material.map?.dispose();
      pd.orbitLine.geometry.dispose();
      (pd.orbitLine.material as THREE.Material).dispose();
      pd.trail.points.geometry.dispose();
      (pd.trail.points.material as THREE.Material).dispose();
    });

    const labelsDiv = labelsRef.current;
    if (labelsDiv) {
      while (labelsDiv.firstChild) {
        labelsDiv.removeChild(labelsDiv.firstChild);
      }
    }

    const newPlanets: PlanetData[] = [];
    const minDist = 7;
    const maxDist = 22;

    goals.forEach((goal, i) => {
      const dist = minDist + ((100 - goal.progress) / 100) * (maxDist - minDist);
      const speed = 0.003 + (goal.progress / 100) * 0.002;
      const angle = (i / Math.max(goals.length, 1)) * Math.PI * 2;

      const pf = goal.progress / 100;
      const planetSize = 1.0 + pf * 0.6;
      const color = hexToThreeColor(goal.color);

      const geo = new THREE.SphereGeometry(planetSize, 48, 48);
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.64,
        metalness: 0.08,
        emissive: color.clone().multiplyScalar(0.22),
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createGlowTexture(goal.color),
          transparent: true,
          opacity: 0.36,
          depthWrite: false,
        })
      );
      glow.scale.set(planetSize * 4.8, planetSize * 4.8, 1);
      scene.add(glow);

      const orbitLine = new THREE.LineLoop(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.14,
        })
      );
      scene.add(orbitLine);
      updateOrbitGeometry(orbitLine, dist);

      const trail = createTrail(goal.color, trailTextureRef.current!);
      scene.add(trail.points);

      if (labelsDiv) {
        const label = document.createElement("div");
        label.className = "planet-label";
        const nameDiv = document.createElement("div");
        nameDiv.className = "name";
        nameDiv.textContent = `${goal.icon || "?"} ${goal.name}`;
        const pctDiv = document.createElement("div");
        pctDiv.className = "pct";
        pctDiv.textContent = `${goal.progress}%`;
        label.appendChild(nameDiv);
        label.appendChild(pctDiv);
        labelsDiv.appendChild(label);
      }

      newPlanets.push({
        mesh,
        glow,
        orbitLine,
        trail,
        goal,
        angle,
        dist,
        speed,
        size: planetSize,
        worldPosition: new THREE.Vector3(),
        hover: false,
      });
    });

    planetsRef.current = newPlanets;
  }, [goals]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    let running = true;

    const animate = () => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(animate);

      const dt = Math.min(clockRef.current.getDelta(), 0.03);
      const elapsed = clockRef.current.getElapsedTime();

      if (starsRef.current) {
        starsRef.current.rotation.y += 0.00024;
        starsRef.current.rotation.x += 0.00005;
      }

      if (sunGroupRef.current) {
        sunGroupRef.current.rotation.y += dt * 0.05;
      }

      planetsRef.current.forEach((pd, i) => {
        const r = pd.dist;
        const a = pd.angle + elapsed * pd.speed;
        const y = Math.sin(elapsed * 0.8 + i * 1.3) * 0.6;

        pd.worldPosition.set(
          Math.cos(a) * r,
          y,
          Math.sin(a) * r
        );

        pd.mesh.position.copy(pd.worldPosition);
        pd.mesh.rotation.y += dt * 0.58;
        pd.mesh.rotation.x += dt * 0.18;

        const hoverScale = pd.hover ? 1.12 : 1;
        const focusScale = trackedGoalRef.current === pd.goal.id ? 1.12 : 1;
        const targetScale = hoverScale * focusScale;
        pd.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

        pd.glow.position.copy(pd.worldPosition);
        pd.glow.lookAt(camera.position);
        const gScale = (pd.size * 4.8) * (pd.hover ? 1.18 : 1) * (trackedGoalRef.current === pd.goal.id ? 1.1 : 1);
        pd.glow.scale.lerp(new THREE.Vector3(gScale, gScale, 1), 0.12);
        pd.glow.material.opacity = THREE.MathUtils.lerp(
          pd.glow.material.opacity,
          pd.hover ? 0.56 : (pd.goal.progress >= 80 ? 0.48 : 0.34),
          0.12
        );

        pd.trail.history.unshift(pd.worldPosition.clone());
        pd.trail.history.pop();
        const arr = pd.trail.points.geometry.attributes.position.array as Float32Array;
        pd.trail.history.forEach((v, idx) => {
          arr[idx * 3 + 0] = v.x;
          arr[idx * 3 + 1] = v.y;
          arr[idx * 3 + 2] = v.z;
        });
        pd.trail.points.geometry.attributes.position.needsUpdate = true;
      });

      if (trackedGoalRef.current !== null) {
        const tracked = planetsRef.current.find(
          (pd) => pd.goal.id === trackedGoalRef.current
        );
        if (tracked) {
          const offset = tracked.worldPosition.clone().normalize().multiplyScalar(Math.max(tracked.size * 4.2, 7.8));
          const destination = tracked.worldPosition.clone().add(offset);
          destination.y += 1.4;
          cameraStateRef.current.desiredPos.copy(destination);
          cameraStateRef.current.desiredTarget.copy(tracked.worldPosition);
        }
      }

      const cs = cameraStateRef.current;
      cs.currentPos.lerp(cs.desiredPos, cs.posLerp);
      cs.currentTarget.lerp(cs.desiredTarget, cs.lookLerp);
      camera.position.copy(cs.currentPos);
      camera.lookAt(cs.currentTarget);

      renderer.render(scene, camera);

      updateLabels(camera, renderer);
    };

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const updateLabels = useCallback((camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    const labelsDiv = labelsRef.current;
    if (!labelsDiv) return;

    const planets = planetsRef.current;
    const rw = renderer.domElement.clientWidth;
    const rh = renderer.domElement.clientHeight;

    planets.forEach((pd, i) => {
      const label = labelsDiv.children[i] as HTMLDivElement | undefined;
      if (!label) return;

      const screen = pd.worldPosition.clone().project(camera);
      const screenX = (screen.x * 0.5 + 0.5) * rw;
      const screenY = (-screen.y * 0.5 + 0.5) * rh + 34;

      if (screen.z > 1 || screenX < -50 || screenX > rw + 50 || screenY < -50 || screenY > rh + 50) {
        label.style.display = "none";
        return;
      }

      label.style.display = "block";
      label.style.left = `${screenX}px`;
      label.style.top = `${screenY}px`;
      label.style.transform = `translate(-50%,-50%) scale(${pd.hover ? 1.04 : 1})`;
      label.style.opacity = trackedGoalRef.current && trackedGoalRef.current !== pd.goal.id ? "0.28" : "1";

      const pctEl = label.querySelector(".pct") as HTMLDivElement | null;
      if (pctEl) {
        const progText = `${pd.goal.progress}%`;
        if (pctEl.textContent !== progText) pctEl.textContent = progText;
      }
    });
  }, []);

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!renderer || !camera || !scene) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);

    const meshes = planetsRef.current.map((pd) => pd.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const pd = planetsRef.current.find((p) => p.mesh === hit);
      if (pd) {
        playZoomSound();
        trackedGoalRef.current = pd.goal.id;
        if (onGoalClickRef.current) {
          const fullGoal = goalsRef.current.find((g) => g.id === pd.goal.id);
          if (fullGoal) onGoalClickRef.current(fullGoal);
        }
        return;
      }
    }

    if (trackedGoalRef.current !== null) {
      trackedGoalRef.current = null;
      hoveredGoalRef.current = null;
      cameraStateRef.current.desiredPos.set(0, 22, 44);
      cameraStateRef.current.desiredTarget.set(0, 0, 0);
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    handleInteraction(e.clientX, e.clientY);
  }, [handleInteraction]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    handleInteraction(touch.clientX, touch.clientY);
  }, [handleInteraction]);

  const hoverVec = useRef(new THREE.Vector2());

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    hoverVec.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    hoverVec.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(hoverVec.current, camera);
    const meshes = planetsRef.current.map((pd) => pd.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes);

    const hitPd = intersects.length > 0
      ? planetsRef.current.find((p) => p.mesh === intersects[0].object)
      : null;

    hoveredGoalRef.current = hitPd ? hitPd.goal.id : null;
    planetsRef.current.forEach((pd) => {
      pd.hover = pd.goal.id === hoveredGoalRef.current;
    });

    renderer.domElement.style.cursor = intersects.length > 0 ? "pointer" : "default";
  }, []);

  if (webglFailed) {
    return (
      <div
        data-testid="orbit-canvas-fallback"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width,
          height,
          background: "radial-gradient(ellipse at center, #0d1130 0%, #060918 35%, #020308 70%, #000000 100%)",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseMove={handleMouseMove}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width,
        height,
        touchAction: "manipulation",
      }}
    />
  );
}
