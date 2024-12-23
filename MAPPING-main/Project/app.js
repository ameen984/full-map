let scene, camera, renderer, model, controls;

function init() {
    const container = document.getElementById('container');

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);
    
    // Add axes helper to visualize orientation
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Create camera with more conservative near/far planes
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10000);
    camera.position.set(5, 5, 5);

    // Create renderer with shadow support
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add ground plane for reference
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Enhanced model loading with better error handling
    const loader = new THREE.FBXLoader();
    loader.load('model.fbx', 
        // Success callback
        function (object) {
            console.log('Model loading started...');
            
            // Remove any previous model
            if (model) {
                scene.remove(model);
            }
            
            model = object;
            
            // Auto-adjust model scale based on its size
            const bbox = new THREE.Box3().setFromObject(model);
            const size = bbox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 5; // Desired size in world units
            const scale = targetSize / maxDim;
            model.scale.setScalar(scale);
            
            // Center the model
            const center = bbox.getCenter(new THREE.Vector3());
            model.position.sub(center.multiplyScalar(scale));
            model.position.y = 0; // Place on ground
            
            // Enable shadows for all meshes
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Log material information for debugging
                    console.log('Mesh found:', child.name);
                    console.log('Material:', child.material);
                }
            });
            
            scene.add(model);
            console.log('Model loaded and added to scene');
            
            // Position camera relative to model
            fitCameraToModel();
            
        },
        // Progress callback
        function (xhr) {
            console.log('Loading progress: ' + (xhr.loaded / xhr.total * 100) + '%');
        },
        // Error callback
        function (error) {
            console.error('Error loading model:', error);
            // More detailed error information
            if (error.currentTarget) {
                console.error('Failed to load:', error.currentTarget.responseURL);
            }
            addFallbackCube();
        }
    );

    // Enhanced orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    window.addEventListener('resize', onWindowResize, false);
}

function fitCameraToModel() {
    if (!model) return;
    
    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2));
    
    camera.position.copy(center);
    camera.position.z += cameraDistance * 1.5;
    camera.position.y += cameraDistance * 0.5;
    camera.lookAt(center);
    
    // Update controls target
    controls.target.copy(center);
    controls.update();
}

function addFallbackCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    model = cube;
    
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

init();
animate();