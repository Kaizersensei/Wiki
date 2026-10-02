import * as THREE from 'three';

/**
 * Automatically generates UVs for a geometry if they don't exist.
 * Uses a grid-based atlas approach to ensure no overlaps.
 */
export function autoUnwrap(geometry: THREE.BufferGeometry) {
  if (geometry.getAttribute('uv')) return;

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) return;

  const index = geometry.getIndex();
  const vertexCount = positionAttribute.count;
  const faceCount = index ? index.count / 3 : vertexCount / 3;

  const gridSize = Math.ceil(Math.sqrt(faceCount));
  const step = 1 / gridSize;

  // Create a new non-indexed geometry or handle mapping
  // Simplest is to de-index the geometry for painting
  if (index) {
    geometry.toNonIndexed();
  }

  const newVertexCount = geometry.getAttribute('position').count;
  const newFaceCount = newVertexCount / 3;
  const uvs = new Float32Array(newVertexCount * 2);

  for (let i = 0; i < newFaceCount; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    const uMin = col * step;
    const vMin = row * step;
    const padding = step * 0.05;

    // Vertex 1
    uvs[i * 6] = uMin + padding;
    uvs[i * 6 + 1] = vMin + padding;

    // Vertex 2
    uvs[i * 6 + 2] = uMin + step - padding;
    uvs[i * 6 + 3] = vMin + padding;

    // Vertex 3
    uvs[i * 6 + 4] = uMin + padding;
    uvs[i * 6 + 5] = vMin + step - padding;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

/**
 * Normalizes a whole group/object into a consistent scale and centers it.
 */
export function normalizeObject(object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  box.getCenter(center);

  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = (1.2 / (maxDim || 1.0)); // Slightly larger scale

  // Move object so its center is at world origin
  object.position.x -= center.x;
  object.position.y -= center.y;
  object.position.z -= center.z;

  // Scale it uniformly
  object.scale.set(scale, scale, scale);
}
