"use client";
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ExcavatorModel({ telemetry }: { telemetry: any }) {
  let scene;
  try {
     const gltf = useGLTF("/HB-001.glb");
     scene = gltf.scene;
  } catch(e) {
     scene = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({color: "orange"}));
  }
  
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    
    // 1. DETERMINE STATE
    const highRisk = telemetry?.thermal_runaway_risk > 50;
    const isDerated = telemetry?.is_derated === true;
    
    // 2. DEFINE COLORS
    const COLOR_RED = 0xff0000;    // Fault Triggered
    const COLOR_ORANGE = 0xffa500; // Derated
    const COLOR_GREEN = 0x00ff00;  // System Normal / Reset
    
    let activeColor = COLOR_GREEN; 
    let shouldShake = false;

    if (highRisk && !isDerated) {
      activeColor = COLOR_RED;
      shouldShake = true;
    } else if (isDerated) {
      activeColor = COLOR_ORANGE;
      shouldShake = false;
    } else {
      activeColor = COLOR_GREEN;
      shouldShake = false;
    }

    // 3. APPLY VISUALS
    if (shouldShake) {
      meshRef.current.position.x = (Math.random() - 0.5) * 0.1;
      meshRef.current.position.y = (Math.random() - 0.5) * 0.1;
    } else {
      meshRef.current.position.set(0, 0, 0);
    }

    // 4. TARGETED SHADING (Capacitor/Battery Only)
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
          const partName = child.name.toLowerCase();
          const isElectricalPart = partName.includes("battery")

          if (isElectricalPart) {
              // Store original color once if not already stored
              if (!child.userData.originalColor) child.userData.originalColor = child.material.color.clone();
              
              // Apply the state-driven color
              child.material.color.setHex(activeColor); 
          } else {
              // Ensure battery parts stay their original color
              if (child.userData.originalColor) {
                  child.material.color.copy(child.userData.originalColor);
              }
          }
      }
    });
  });

  return <primitive ref={meshRef} object={scene} scale={0.2} position={[0, -2, 0]} />;
}