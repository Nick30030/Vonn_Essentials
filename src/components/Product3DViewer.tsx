import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float, ContactShadows, Decal, useTexture, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useMemo } from "react";

function ProductModel({ imageUrl, productName }: { imageUrl: string; productName: string }) {
  const isBottle = productName.toLowerCase().includes("wash") || productName.toLowerCase().includes("serum") || productName.toLowerCase().includes("spray");
  const isSoap = productName.toLowerCase().includes("soap");
  const isCharcoal = productName.toLowerCase().includes("charcoal");

  // Use server-side proxy to bypass CORS issues on 3D textures
  const proxiedUrl = useMemo(() => `/api/proxy?url=${encodeURIComponent(imageUrl)}`, [imageUrl]);

  // Loading texture with proxied URL
  const texture = useTexture(proxiedUrl);
  
  // Custom texture settings for better clarity
  const textureMap = useMemo(() => {
    if (!texture) return null;
    const t = Array.isArray(texture) ? texture[0] : texture;
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 16;
    return t;
  }, [texture]);
  
  // Custom materials based on product type
  const baseMaterial = useMemo(() => {
    if (isCharcoal && isSoap) {
      return new THREE.MeshStandardMaterial({
        color: "#1a1a1a", // Deep charcoal black
        roughness: 0.8,
        metalness: 0.1,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: isBottle ? "#fcfcfc" : "#ffffff",
      roughness: 0.15,
      metalness: 0.05,
    });
  }, [isBottle, isSoap, isCharcoal]);

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group>
        {/* Main Body */}
        {isBottle ? (
          <mesh castShadow receiveShadow material={baseMaterial}>
            <cylinderGeometry args={[0.82, 0.85, 2.9, 64]} />
            {textureMap && (
              <Decal
                position={[0, 0, 0.85]}
                rotation={[0, 0, 0]}
                scale={[1.3, 2.0, 1]}
              >
                <meshStandardMaterial
                  map={textureMap}
                  transparent
                  polygonOffset
                  polygonOffsetFactor={-10}
                  roughness={0.2}
                  metalness={0.05}
                />
              </Decal>
            )}
          </mesh>
        ) : isSoap ? (
          <RoundedBox args={[1.8, 1.2, 0.6]} radius={0.1} smoothness={4} castShadow receiveShadow material={baseMaterial}>
            {textureMap && (
              <Decal
                position={[0, 0, 0.31]}
                rotation={[0, 0, 0]}
                scale={[1.45, 0.95, 1]}
              >
                <meshStandardMaterial
                  map={textureMap}
                  transparent
                  polygonOffset
                  polygonOffsetFactor={-10}
                  roughness={isCharcoal ? 0.8 : 0.2}
                  metalness={0.05}
                />
              </Decal>
            )}
          </RoundedBox>
        ) : (
          <mesh castShadow receiveShadow material={baseMaterial}>
            <boxGeometry args={[1.85, 1.05, 0.5]} />
            {textureMap && (
              <Decal
                position={[0, 0, 0.26]}
                rotation={[0, 0, 0]}
                scale={[1.5, 0.9, 1]}
              >
                <meshStandardMaterial
                  map={textureMap}
                  transparent
                  polygonOffset
                  polygonOffsetFactor={-10}
                  roughness={0.2}
                  metalness={0.05}
                />
              </Decal>
            )}
          </mesh>
        )}

        {/* Bottle Hardware detail */}
        {isBottle && (
          <group position={[0, 1.45, 0]}>
            <mesh position={[0, 0, 0]}>
               <cylinderGeometry args={[0.4, 0.45, 0.2, 32]} />
               <meshStandardMaterial color="#ddd" roughness={0.1} metalness={1} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.3, 0.35, 0.4, 32]} />
              <meshStandardMaterial color="#111" roughness={0.4} metalness={0.6} />
            </mesh>
          </group>
        )}
      </group>
    </Float>
  );
}

function LoaderFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#eee" wireframe />
    </mesh>
  );
}

export default function Product3DViewer({ imageUrl, productName }: { imageUrl: string; productName: string }) {
  return (
    <div className="w-full h-full min-h-[500px] cursor-grab active:cursor-grabbing bg-white">
      <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Suspense fallback={<LoaderFallback />}>
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />
          
          {/* Realistic High-End Studio Lighting */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1.8} castShadow shadow-mapSize={1024} />
          <directionalLight position={[-5, 5, -5]} intensity={0.3} />
          <directionalLight position={[0, 5, 5]} intensity={0.8} />
          <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
          <pointLight position={[0, -10, 0]} intensity={0.2} />
          
          <ProductModel imageUrl={imageUrl} productName={productName} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false}
            minDistance={4}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={0.8}
            makeDefault
          />
          
          <Environment preset="studio" />
          <ContactShadows 
            position={[0, -1.6, 0]} 
            opacity={0.45} 
            scale={8} 
            blur={1.8} 
            far={3.5} 
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
