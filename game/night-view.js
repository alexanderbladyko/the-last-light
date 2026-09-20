import * as THREE from 'three';

// Ghostlight uses the simulation's exact position, radius and lifetime.
export function createNightView(scene) {
  const models = new Map();
  const disc = new THREE.CircleGeometry(1, 48), rim = new THREE.RingGeometry(.95, 1, 48);
  const mote = new THREE.SphereGeometry(.10, 8, 6);
  function remove(id) {
    const group = models.get(id); scene.remove(group);
    group.children.forEach(mesh => mesh.material.dispose()); models.delete(id);
  }
  function update(game, clock) {
    for (const id of models.keys()) if (!game.ghostlights.some(light => light.id === id)) remove(id);
    for (const light of game.ghostlights) {
      let group = models.get(light.id);
      if (!group) {
        group = new THREE.Group(); group.position.set(light.x, .102, light.z);
        for (const [geometry, opacity] of [[disc, .10], [rim, .65]]) {
          const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:'#9bdbd8', transparent:true, opacity, depthWrite:false}));
          mesh.rotation.x = -Math.PI / 2; mesh.scale.setScalar(light.radius); group.add(mesh);
        }
        const spark = new THREE.Mesh(mote, new THREE.MeshBasicMaterial({color:'#dcf8e2', transparent:true, opacity:.9}));
        spark.position.y = .2; group.add(spark); scene.add(group); models.set(light.id, group);
      }
      const fade = Math.min(1, light.life / .65), shimmer = .92 + Math.sin(clock * 3 + light.id) * .08;
      group.children[0].material.opacity = .10 * fade;
      group.children[1].material.opacity = .65 * fade * shimmer;
      group.children[2].material.opacity = .9 * fade;
      group.children[2].position.y = .2 + Math.sin(clock * 2 + light.id) * .08;
    }
  }
  function reset() { for (const id of models.keys()) remove(id); }
  return {update, reset};
}
