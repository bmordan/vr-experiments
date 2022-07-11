AFRAME.registerComponent('mushroom', {
    init: function () {
        this.geometry = new THREE.BoxBufferGeometry(1,1,1)
        this.material = new THREE.MeshStandardMaterial({color: '#fcba03'})
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.el.setObject3D('mesh', this.mesh)
    }
})