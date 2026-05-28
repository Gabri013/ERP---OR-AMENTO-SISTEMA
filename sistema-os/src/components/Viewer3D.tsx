import {
  Suspense,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  useProgress,
  useGLTF,
  Environment,
  ContactShadows,
  Bounds,
  useBounds,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Box,
  AlertTriangle,
  Download,
  Eye,
  RefreshCw,
  SunMedium,
  Grid3x3,
  Smartphone,
  Layers,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Format helpers ────────────────────────────────────

function getFormat(url: string): string {
  const clean = url.split("?")[0];
  return clean.split(".").pop()?.toLowerCase() ?? "unknown";
}

// ─── Loading ───────────────────────────────────────────

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-white select-none pointer-events-none">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div
            className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin"
            style={{
              borderColor: "transparent transparent transparent #4f8ef7",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <span className="text-xs text-white/70">Carregando modelo...</span>
      </div>
    </Html>
  );
}

// ─── Auto-fit camera to model bounds ──────────────────

function AutoFitOnLoad() {
  const bounds = useBounds();
  useEffect(() => {
    // Wait one frame so geometry is fully loaded
    const id = requestAnimationFrame(() => {
      bounds.refresh().fit();
    });
    return () => cancelAnimationFrame(id);
  }, [bounds]);
  return null;
}

// ─── Models ────────────────────────────────────────────

function STLModel({
  url,
  wireframe,
  color,
  envIntensity,
}: {
  url: string;
  wireframe: boolean;
  color: string;
  envIntensity: number;
}) {
  const geometry = useLoader(STLLoader, url);

  const processedGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeVertexNormals();
    geo.center();
    return geo;
  }, [geometry]);

  return (
    <mesh geometry={processedGeometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        metalness={0.6}
        roughness={0.35}
        reflectivity={0.5}
        wireframe={wireframe}
        side={THREE.DoubleSide}
        envMapIntensity={envIntensity}
      />
    </mesh>
  );
}

function OBJModel({
  url,
  wireframe,
  color,
}: {
  url: string;
  wireframe: boolean;
  color: string;
}) {
  const obj = useLoader(OBJLoader, url);

  const scene = useMemo(() => {
    const clone = obj.clone();
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mat = new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.5,
          roughness: 0.4,
          wireframe,
        });
        child.material = mat;
      }
    });
    return clone;
  }, [obj, color, wireframe]);

  return <primitive object={scene} />;
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const c = scene.clone();
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    c.position.sub(center);
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return <primitive object={cloned} />;
}

// ─── Scene ────────────────────────────────────────────

function Scene({
  url,
  format,
  wireframe,
  showGrid,
  showShadow,
  color,
  autoRotate,
}: {
  url: string;
  format: string;
  wireframe: boolean;
  showGrid: boolean;
  showShadow: boolean;
  color: string;
  autoRotate: boolean;
}) {
  const { invalidate } = useThree();
  const orbitRef = useRef<any>(null);

  // Auto-rotate via orbit controls
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.autoRotate = autoRotate;
      orbitRef.current.autoRotateSpeed = 1.5;
    }
  }, [autoRotate]);

  useFrame(() => {
    if (autoRotate) invalidate();
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-8, 8, -5]} intensity={0.6} />
      <directionalLight position={[0, -5, 0]} intensity={0.2} />
      <pointLight position={[0, 20, 0]} intensity={0.4} />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Model wrapped in Bounds for auto-fit */}
      <Bounds fit clip damping={6} margin={1.2}>
        <AutoFitOnLoad />
        <Suspense fallback={<Loader />}>
          {format === "stl" && (
            <STLModel
              url={url}
              wireframe={wireframe}
              color={color}
              envIntensity={0.8}
            />
          )}
          {format === "obj" && (
            <OBJModel url={url} wireframe={wireframe} color={color} />
          )}
          {(format === "gltf" || format === "glb") && <GLTFModel url={url} />}
        </Suspense>
      </Bounds>

      {/* Ground shadow */}
      {showShadow && !wireframe && (
        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={5}
        />
      )}

      {/* Grid */}
      {showGrid && (
        <gridHelper args={[40, 40, "#333", "#222"]} position={[0, -2.5, 0]} />
      )}

      {/* Orbit controls */}
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.001}
        maxDistance={Infinity}
        enablePan
        panSpeed={1.2}
        rotateSpeed={0.7}
        zoomSpeed={1.8}
        onChange={() => invalidate()}
      />

      {/* Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
        <GizmoViewport
          axisColors={["#e05555", "#34d997", "#4f8ef7"]}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
}

// ─── Unsupported format ────────────────────────────────

function UnsupportedFormat({ format, url }: { format: string; url: string }) {
  const msgs: Record<string, string> = {
    step: "Arquivo STEP/STP é formato CAD nativo. No SolidWorks: Arquivo → Salvar Como → STL ou OBJ para visualizar aqui.",
    dxf: "DXF é formato 2D. Para visualização 3D, exporte como STL ou OBJ.",
    dwg: "DWG é formato AutoCAD binário. Exporte como STL ou OBJ para visualizar.",
    iges: "IGES é formato CAD. Exporte como STL no SolidWorks para visualizar.",
  };
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <AlertTriangle className="h-14 w-14 text-yellow-400 opacity-80" />
      <div className="space-y-2 max-w-sm">
        <p className="font-semibold text-white text-base">
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-yellow-400 uppercase">
            .{format}
          </span>{" "}
          não suportado para visualização
        </p>
        <p className="text-sm text-white/50 leading-relaxed">
          {msgs[format] ?? "Suportados: STL, OBJ, GLTF, GLB"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {["STL ✓", "OBJ ✓", "GLTF ✓", "GLB ✓"].map((f) => (
          <Badge
            key={f}
            className="bg-green-500/15 text-green-400 border-green-500/20 font-mono"
          >
            {f}
          </Badge>
        ))}
        {["STEP ✗", "DXF ✗", "DWG ✗"].map((f) => (
          <Badge
            key={f}
            className="bg-red-500/15 text-red-400 border-red-500/20 font-mono"
          >
            {f}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-white/30">
        SolidWorks: Arquivo → Salvar Como → STL (resolução: baixa para
        visualização)
      </p>
      <a href={url} target="_blank" rel="noopener noreferrer" download>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar arquivo original
        </Button>
      </a>
    </div>
  );
}

// ─── Palette ───────────────────────────────────────────

const PALETTE = [
  { color: "#4f8ef7", name: "Azul" },
  { color: "#e8e8e8", name: "Prata" },
  { color: "#34d997", name: "Verde" },
  { color: "#f0a030", name: "Laranja" },
  { color: "#9b7ff4", name: "Roxo" },
  { color: "#e05555", name: "Vermelho" },
  { color: "#f4c261", name: "Dourado" },
  { color: "#26c9b8", name: "Teal" },
];

// ─── Toolbar button ────────────────────────────────────

function TB({
  onClick,
  title,
  active,
  children,
}: {
  onClick?: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg text-white/60 hover:text-white transition-all",
        active
          ? "bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/40"
          : "hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}

// ─── Main component ────────────────────────────────────

export interface Viewer3DProps {
  url: string;
  nome?: string;
  format?: string;
  className?: string;
  height?: string | number;
}

export function Viewer3D({
  url,
  nome,
  format: formatProp,
  className,
  height = 500,
}: Viewer3DProps) {
  const format = formatProp?.toLowerCase() ?? getFormat(url);
  const isSupported = ["stl", "obj", "gltf", "glb"].includes(format);

  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showShadow, setShowShadow] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current
        .requestFullscreen?.()
        .then(() => setFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl select-none",
        fullscreen ? "rounded-none" : "",
        className,
      )}
      style={{ background: "#0a0c10" }}
    >
      {/* ── Top bar ──────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-3 py-2.5 bg-gradient-to-b from-black/70 via-black/20 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Box className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-white text-sm font-medium truncate max-w-[260px] leading-tight">
            {nome ?? "Modelo 3D"}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 font-mono uppercase shrink-0",
              isSupported
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30",
            )}
          >
            {format}
          </Badge>
        </div>
        <div className="flex items-center gap-1 pointer-events-auto">
          <TB
            onClick={toggleFullscreen}
            title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </TB>
          <a href={url} download title="Baixar arquivo">
            <TB title="Baixar arquivo">
              <Download className="h-3.5 w-3.5" />
            </TB>
          </a>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────── */}
      <div style={{ height: h }}>
        {contextLost ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/60">
            <AlertTriangle className="h-10 w-10 text-yellow-400" />
            <p className="text-sm">Contexto WebGL perdido</p>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setContextLost(false)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Recarregar
            </Button>
          </div>
        ) : isSupported ? (
          <Canvas
            frameloop="demand"
            camera={{ fov: 45, near: 0.001, far: 50000, position: [5, 3, 8] }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              logarithmicDepthBuffer: true,
            }}
            dpr={[1, 1.5]}
            shadows
            style={{ background: "#0a0c10" }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener("webglcontextlost", () =>
                setContextLost(true),
              );
              gl.domElement.addEventListener("webglcontextrestored", () =>
                setContextLost(false),
              );
            }}
          >
            <Scene
              url={url}
              format={format}
              wireframe={wireframe}
              showGrid={showGrid}
              showShadow={showShadow}
              color={PALETTE[colorIdx].color}
              autoRotate={autoRotate}
            />
          </Canvas>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ height: h }}
          >
            <UnsupportedFormat format={format} url={url} />
          </div>
        )}
      </div>

      {/* ── Bottom toolbar ───────────────────────────── */}
      {isSupported && !contextLost && (
        <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between gap-2 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          {/* Controls */}
          <div className="flex items-center gap-1">
            <TB
              onClick={() => setWireframe(!wireframe)}
              title="Wireframe"
              active={wireframe}
            >
              <Eye className="h-3.5 w-3.5" />
            </TB>
            <TB
              onClick={() => setShowShadow(!showShadow)}
              title="Sombra"
              active={showShadow}
            >
              <SunMedium className="h-3.5 w-3.5" />
            </TB>
            <TB
              onClick={() => setShowGrid(!showGrid)}
              title="Grade"
              active={showGrid}
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </TB>
            <TB
              onClick={() => setAutoRotate(!autoRotate)}
              title="Rotação automática"
              active={autoRotate}
            >
              <RotateCcw
                className={cn("h-3.5 w-3.5", autoRotate && "animate-spin")}
              />
            </TB>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5">
            {PALETTE.map((p, i) => (
              <button
                key={p.color}
                title={p.name}
                onClick={() => setColorIdx(i)}
                className={cn(
                  "rounded-full transition-all duration-150 border",
                  colorIdx === i
                    ? "w-5 h-5 scale-110 border-white shadow-lg"
                    : "w-4 h-4 border-transparent opacity-60 hover:opacity-100 hover:scale-110",
                )}
                style={{ backgroundColor: p.color }}
              />
            ))}
          </div>

          {/* Hint */}
          <p className="text-white/25 text-[10px] hidden sm:block shrink-0">
            ↙ arrastar · scroll · direito=pan
          </p>
        </div>
      )}
    </div>
  );
}
