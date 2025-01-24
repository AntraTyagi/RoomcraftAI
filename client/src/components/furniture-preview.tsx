import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import { Card } from "@/components/ui/card";

interface FurniturePreviewProps {
  furnitureModel?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

function Scene({ furnitureModel, position = [0, 0, 0], rotation = [0, 0, 0] }: FurniturePreviewProps) {
  const { scene } = useGLTF(furnitureModel || "/models/default-furniture.glb");

  useFrame((state) => {
    // Add subtle rotation animation
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <primitive 
        object={scene} 
        position={position}
        rotation={rotation}
        scale={[1, 1, 1]}
      />
      <gridHelper args={[10, 10]} />
      <OrbitControls enableZoom={true} enablePan={true} />
    </>
  );
}

export default function FurniturePreview({ 
  furnitureModel,
  position,
  rotation 
}: FurniturePreviewProps) {
  return (
    <Card className="w-full aspect-square">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <Scene 
          furnitureModel={furnitureModel}
          position={position}
          rotation={rotation}
        />
      </Canvas>
    </Card>
  );
}
