import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Box } from "@react-three/drei";
<<<<<<< HEAD
import { Card } from "../components/ui/card";
=======
import { Card } from "@/components/ui/card";
>>>>>>> 67d56753a5fe62bb581f258b91f41dbd00a3feff

interface FurniturePreviewProps {
  furnitureModel?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

function Scene({ furnitureModel, position = [0, 0, 0], rotation = [0, 0, 0] }: FurniturePreviewProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Default box geometry when no model is available */}
      <Box 
        position={position}
        rotation={rotation}
        args={[1, 1, 1]} // width, height, depth
      >
        <meshStandardMaterial color="#666" />
      </Box>

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