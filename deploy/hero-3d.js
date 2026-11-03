(function () {
  var stage = document.getElementById("stage"), canvas = document.getElementById("c");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    var SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#FF2E2E" d="M911.54 814.84 L661.38 625.57 C637.83 605.09 632.19 587.43 630.00 562.38 L630.00 411.00 C630.00 390.66 637.72 371.32 651.69 356.54 C651.69 356.54 723.19 280.83 723.23 280.80 C738.22 265.03 764.70 256.00 786.35 256.00 L882.61 256.00 C904.41 256.00 930.96 265.11 945.88 280.94 L959.56 295.43 C959.56 295.43 973.35 280.83 973.39 280.80 C988.38 265.03 1014.86 256.00 1036.51 256.00 L1132.74 256.00 C1154.54 256.00 1181.13 265.11 1196.05 281.02 L1267.44 356.61 C1281.41 371.39 1289.09 390.70 1289.09 411.00 L1289.09 562.38 C1289.09 589.29 1272.71 612.88 1258.95 624.62 C1090.24 743.52 974.59 623.23 937.03 586.59 C918.86 568.85 918.49 539.70 936.27 521.52 C954.04 503.35 983.15 503.02 1001.37 520.76 C1055.71 570.06 1117.78 604.00 1197.03 562.38 L1197.03 411.00 L1132.78 348.02 L1036.55 348.02 L993.06 394.03 C984.36 403.24 972.25 411.00 959.60 411.00 C946.95 411.00 934.84 403.24 926.14 394.03 L882.65 348.02 L786.39 348.02 L722.13 411.00 L722.13 562.38 L967.21 741.51 C987.47 756.84 991.46 785.69 976.13 805.95 C950.79 833.71 923.06 822.34 911.65 814.84 L911.54 814.84 Z"/></svg>';

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    function srgb(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    scene.add(new THREE.HemisphereLight(srgb(0xffffff), srgb(0x8a2230), 0.6));
    var key = new THREE.DirectionalLight(srgb(0xffffff), 1.0); key.position.set(3, 4, 5); scene.add(key);
    var rim = new THREE.DirectionalLight(srgb(0xffffff), 0.7); rim.position.set(-4, 1, -3); scene.add(rim);

    var envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: srgb(0xe8e8e8) })));
    function panel(x, y, z, w, h, i) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: srgb(new THREE.Color(i, i, i).getHex()), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
    }
    panel(5, 6, 6, 6, 4, 2.2); panel(-7, 2, 3, 3, 6, 1.1); panel(0, 8, -4, 8, 3, 1.6); panel(0, -6, 5, 8, 2, 0.4);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.04).texture;

    var pivot = new THREE.Group(); scene.add(pivot);
    var shapes = [];
    new THREE.SVGLoader().parse(SVG).paths.forEach(function (p) { shapes = shapes.concat(THREE.SVGLoader.createShapes(p)); });
    var geo = new THREE.ExtrudeGeometry(shapes, { depth: 90, bevelEnabled: true, bevelThickness: 22, bevelSize: 16, bevelSegments: 12, curveSegments: 32 });
    geo.center();
    var mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: srgb(0xff2e2e), emissive: srgb(0xff2e2e), emissiveIntensity: 0.15, roughness: 0.35, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 0.3 }));
    mesh.scale.y = -1;
    pivot.add(mesh);
    geo.computeBoundingBox();
    var sz = geo.boundingBox.getSize(new THREE.Vector3());
    var base = 3.1 / Math.max(sz.x, sz.y);
    pivot.scale.setScalar(base);
    pivot.rotation.y = -0.5;

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(stage); resize();

    // o símbolo segue o ponteiro (suave) em vez de girar sem parar
    var px = 0, py = 0;
    window.addEventListener("pointermove", function (e) {
      px = (e.clientX / window.innerWidth - 0.5) * 2;
      py = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    var clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      var phase = t % 3;                                   // mesmo ciclo da linha de batimento
      var beat = (!reduce && phase > 1.55) ? Math.min(1, (phase - 1.55) / 0.12) * Math.exp(-(phase - 1.55) * 5) : 0;
      var ty = px * 0.7 - 0.2 + (reduce ? 0 : Math.sin(t * 0.5) * 0.3);
      var tx = py * 0.3;
      pivot.rotation.y += (ty - pivot.rotation.y) * 0.06;
      pivot.rotation.x += (tx - pivot.rotation.x) * 0.06;
      pivot.scale.setScalar(base * (1 + 0.035 * beat));
      renderer.render(scene, camera);
    })();
  } catch (e) {
    stage.innerHTML = SVG ? '' : '';
  }
})();
