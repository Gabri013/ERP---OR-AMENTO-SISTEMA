import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Center,
  Html,
  useProgress,
  useGLTF,
  Grid,
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
  Grid3x3,
  Sun,
  Maximize2,
  Minimize2,
  Box,
  AlertTriangle,
  Download,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Loaders ─────────────────────────────────────────────

function LoadingIndicator() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-white select-none">
        <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-sm font-medium">Carregando modelo...</span>
        <span className="text-xl font-bold tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

function STLModel({
  url,
  wireframe,
  color,
}: {
  url: string;
  wireframe: boolean;
  color: string;
}) {
  const geometry = useLoader(STLLoader, url);
  useEffect(() => {
    geometry.computeVertexNormals();
    geometry.center();
  }, [geometry]);

  return (
    <Center>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={0.4}
          roughness={0.5}
          wireframe={wireframe}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Center>
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
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = Array.isArray(child.material)
            ? child.material[0]
            : child.material;
          (mat as THREE.MeshStandardMaterial).color = new THREE.Color(color);
          (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
          (mat as THREE.MeshStandardMaterial).metalness = 0.4;
          (mat as THREE.MeshStandardMaterial).roughness = 0.5;
        }
      }
    });
  }, [obj, wireframe, color]);
  return <primitive object={obj} />;
}

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center);
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

function AutoRotate({ enabled }: { enabled: boolean }) {
  useFrame((state, delta) => {
    if (!enabled) return;
    state.camera.position.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      delta * 0.3,
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Format detection ────────────────────────────────────

function getFormat(
  url: string,
): "stl" | "obj" | "gltf" | "glb" | "step" | "dxf" | "unknown" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "stl") return "stl";
  if (ext === "obj") return "obj";
  if (ext === "gltf") return "gltf";
  if (ext === "glb") return "glb";
  if (ext === "step" || ext === "stp") return "step";
  if (ext === "dxf") return "dxf";
  return "unknown";
}

const FORMAT_COLORS: Record<string, string> = {
  stl: "#4f8ef7",
  obj: "#34d997",
  gltf: "#9b7ff4",
  glb: "#9b7ff4",
};

// Suppress unused warning — kept for potential consumer use
void FORMAT_COLORS;

// ─── Unsupported format message ──────────────────────────

function UnsupportedFormat({ format, url }: { format: string; url: string }) {
  const messages: Record<string, string> = {
    step: "Arquivos STEP/STP são CAD nativo e precisam ser convertidos para STL ou GLTF para visualização no browser. Use SolidWorks, Fusion 360 ou FreeCAD para exportar.",
    dxf: "Arquivos DXF são principalmente 2D. Para visualização 3D, exporte como STL ou OBJ do AutoCAD.",
    unknown: "Formato não reconhecido. Suportados: STL, OBJ, GLTF, GLB.",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-400" />
      <div>
        <p className="font-semibold text-white text-lg mb-2">
          Formato{" "}
          <span className="font-mono uppercase text-yellow-400">.{format}</span>{" "}
          não suportado para visualização
        </p>
        <p className="text-sm text-white/60 max-w-md">
          {messages[format] ?? messages.unknown}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          ✓ STL
        </Badge>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          ✓ OBJ
        </Badge>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
          ✓ GLTF / GLB
        </Badge>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          ✗ STEP
        </Badge>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          ✗ DXF
        </Badge>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" download>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-white border-white/30 hover:bg-white/10"
        >
          <Download className="h-4 w-4" />
          Baixar arquivo original
        </Button>
      </a>
    </div>
  );
}

// ─── 3D Scene ─────────────────────────────────────────────

function Scene({
  url,
  format,
  wireframe,
  showGrid,
  color,
  autoRotate,
}: {
  url: string;
  format: string;
  wireframe: boolean;
  showGrid: boolean;
  color: string;
  autoRotate: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-10, -5, -5]} intensity={0.4} />
      <pointLight position={[0, 10, 0]} intensity={0.8} />

      <Suspense fallback={<LoadingIndicator />}>
        {format === "stl" && (
          <STLModel url={url} wireframe={wireframe} color={color} />
        )}
        {format === "obj" && (
          <OBJModel url={url} wireframe={wireframe} color={color} />
        )}
        {(format === "gltf" || format === "glb") && <GLTFModel url={url} />}
      </Suspense>

      {showGrid && (
        <Grid
          position={[0, -1.5, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#444"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={20}
          fadeStrength={1}
          followCamera={false}
        />
      )}

      <AutoRotate enabled={autoRotate} />

      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport
          axisColors={["#e05555", "#34d997", "#4f8ef7"]}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
}

// ─── Main Viewer ─────────────────────────────────────────

export interface Viewer3DProps {
  url: string;
  nome?: string;
  /** Override format detection — pass the file tipo from DB (stl, obj, gltf, etc.) */
  format?: string;
  className?: string;
  height?: string | number;
}

const MODEL_COLORS = [
  "#4f8ef7",
  "#34d997",
  "#9b7ff4",
  "#f0a030",
  "#e05555",
  "#26c9b8",
  "#f4a261",
  "#e76f51",
];

export function Viewer3D({
  url,
  nome,
  format: formatProp,
  className,
  height = 500,
}: Viewer3DProps) {
  // Prefer explicit format prop (when file is served from DB without extension in URL)
  const format = formatProp?.toLowerCase() ?? getFormat(url);
  const isSupported = ["stl", "obj", "gltf", "glb"].includes(format);

  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetCamera = useCallback(() => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  }, []);

  const handleZoom = useCallback((factor: number) => {
    if (orbitRef.current) {
      const camera = orbitRef.current.object as THREE.PerspectiveCamera;
      camera.position.multiplyScalar(factor);
      camera.updateProjectionMatrix();
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden bg-[#0e1117]",
        className,
      )}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-blue-400" />
          <span className="text-white text-sm font-medium truncate max-w-[200px]">
            {nome ?? "Modelo 3D"}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 font-mono uppercase",
              isSupported
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30",
            )}
          >
            {format}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
          onClick={toggleFullscreen}
          title="Tela cheia"
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Controls toolbar */}
      {isSupported && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-2 text-xs gap-1",
              wireframe
                ? "text-blue-400 bg-blue-400/10"
                : "text-white/70 hover:text-white",
            )}
            onClick={() => setWireframe(!wireframe)}
            title="Wireframe"
          >
            <Eye className="h-3.5 w-3.5" />
            Wire
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-2 text-xs gap-1",
              showGrid ? "text-white/90" : "text-white/40",
            )}
            onClick={() => setShowGrid(!showGrid)}
            title="Grade"
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            Grade
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-2 text-xs gap-1",
              autoRotate
                ? "text-purple-400 bg-purple-400/10"
                : "text-white/70 hover:text-white",
            )}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Rotação automática"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Auto
          </Button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white/70 hover:text-white"
            onClick={() => handleZoom(0.85)}
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white/70 hover:text-white"
            onClick={() => handleZoom(1.15)}
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white/70 hover:text-white"
            onClick={resetCamera}
            title="Resetar câmera"
          >
            <Sun className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <div className="flex gap-1">
            {MODEL_COLORS.slice(0, 5).map((c, i) => (
              <button
                key={c}
                title={`Cor ${i + 1}`}
                onClick={() => setColorIdx(i)}
                className={cn(
                  "w-4 h-4 rounded-full border transition-all",
                  colorIdx === i
                    ? "scale-125 border-white"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <p className="text-white/40 text-[10px]">
            Arrasta · Scroll · Clique direito
          </p>
        </div>
      )}

      {/* Canvas */}
      <div style={{ height: h }}>
        {isSupported ? (
          <Canvas
            camera={{ position: [3, 2, 5], fov: 50 }}
            shadows
            gl={{ antialias: true, alpha: false }}
            style={{ background: "#0e1117" }}
          >
            <Scene
              url={url}
              format={format}
              wireframe={wireframe}
              showGrid={showGrid}
              color={MODEL_COLORS[colorIdx]}
              autoRotate={autoRotate}
            />
            <OrbitControls
              ref={orbitRef}
              makeDefault
              enableDamping
              dampingFactor={0.05}
              minDistance={0.5}
              maxDistance={100}
              enablePan
              panSpeed={1.5}
              rotateSpeed={0.8}
              zoomSpeed={1.2}
            />
          </Canvas>
        ) : (
          <div
            style={{ height: h }}
            className="flex items-center justify-center"
          >
            <UnsupportedFormat format={format} url={url} />
          </div>
        )}
      </div>
    </div>
  );
}
