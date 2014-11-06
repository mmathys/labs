// (function(){

    var scene, camera, renderer, controls;
    var material, composer, clock, world;
    var mouse, projector, raycaster;
    var step = 0;
    var jsonLoader;
    var audio;
    var postprocessing = {};

    var badTVParams, rgbParams;

    initAudio();

    function initAudio() {
        var context, source;
        context = new (AudioContext || webkitAudioContext)();
        analyser = context.createAnalyser();
        source = null;
        audio = new Audio();
        audio.src = 'audio/remember.mp3';
        audio.addEventListener('canplay', function () {
            var bufferLength;
            console.log('audio canplay');
            source = context.createMediaElementSource(audio);
            source.connect(analyser);
            source.connect(context.destination);
            bufferLength = analyser.frequencyBinCount;
            buildScene();
            return analyserDataArray = new Uint8Array(bufferLength);
        });
    };

    function initPass(){
        composer = new THREE.EffectComposer( renderer );
        composer.addPass( new THREE.RenderPass( scene, camera ) );
        postprocessing.composer = composer;

        var width = window.innerWidth;
        var height = window.innerHeight;

        var passes = [
            // ['vignette', new THREE.ShaderPass( THREE.VignetteShader ), true],
            ["film", new THREE.FilmPass( 0.35, 0.5, 2048, true ), false],
            ["badtv", new THREE.ShaderPass( THREE.BadTVShader ), false],
            ["rgbPass", new THREE.ShaderPass( THREE.RGBShiftShader ), false],
            ['staticPass', new THREE.ShaderPass( THREE.StaticShader ), false],
            ["glitch", new THREE.GlitchPass(), true]
        ]

        for (var i = 0; i < passes.length; i++) {
            postprocessing[passes[i][0]] = passes[i][1];
            if(passes[i][2]) passes[i][1].renderToScreen = passes[i][2];
            composer.addPass(passes[i][1]);
        };

        rgbParams = {
            amount: 0.005,
            angle: 0.0,
        }

        badTVParams = {
            distortion: 50,
            distortion2: -10,
            speed: 10.7,
            rollSpeed: 10.9
        }

        staticParams = {
            show: true,
            amount:1.5,
            size2:10.0
        }

        postprocessing['badtv'].uniforms[ "distortion" ].value = badTVParams.distortion;
        postprocessing['badtv'].uniforms[ "distortion2" ].value = badTVParams.distortion2;
        postprocessing['badtv'].uniforms[ "speed" ].value = badTVParams.speed;
        postprocessing['badtv'].uniforms[ "rollSpeed" ].value = badTVParams.rollSpeed;

        postprocessing['rgbPass'].uniforms[ "angle" ].value = rgbParams.angle*Math.PI;
        postprocessing['rgbPass'].uniforms[ "amount" ].value = rgbParams.amount;

        postprocessing['staticPass'].uniforms[ "amount" ].value = staticParams.amount;
        postprocessing['staticPass'].uniforms[ "size" ].value = staticParams.size2;
    }

    function animate()
    {

        // rgbParams.amount = Math.sin(time) * .001;

        TweenLite.to(rgbParams, .3, {amount: 0, ease: 'Back.easeOut', onComplete: function(){
            TweenLite.to(rgbParams, .3, {amount: .005, ease: 'Back.easeIn'});
        }});

        TweenLite.to(badTVParams, .3, {distortion: 0, distortion2: 0, ease: 'Back.easeIn', onComplete: function(){
            TweenLite.to(badTVParams, .3, {delay: 3, distortion: 20, distortion2: 50, ease: 'Back.easeIn', onComplete: animate});
        }});
    }

    function renderPass() {
        postprocessing.composer.render(.1);
    }

    function getRandomColor()
    {
        colors = [0x9b59b6, 0xe74c3c, 0xf1c40f, 0xd35400, 0x1abc9c, 0x95a5a6, 0x3498db]
        step++;
        return colors[step%colors.length];
    }

    function buildScene() {
        scene = new THREE.Scene();
        // camera = new THREE.OrthographicCamera(window.innerWidth * -0.5, window.innerWidth * 0.5, window.innerHeight * 0.5, window.innerHeight * -0.5, .1, 500);
        camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.z = 50;
        camera.lookAt(0);
        scene.add( camera );

        mouse = new THREE.Vector2( 0, 0 );
        raycaster = new THREE.Raycaster();

        clock = new THREE.Clock( false );

        textureMask = THREE.ImageUtils.loadTexture('img/3d/VMaskCol.jpg', {}, function(){
            jsonLoader = new THREE.JSONLoader();
            jsonLoader.load( "img/3d/mask.js", createScene );    
        });

    };

    function createScene(geometry, materials)
    {
        mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
        scene.add(mesh);

        renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.autoClear=false;
        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        document.body.appendChild( renderer.domElement );
        renderer.setSize( window.innerWidth, window.innerHeight);

        clock.start();

        scene.add(new THREE.AmbientLight( 0xFFFFFF ));
        var l = new THREE.DirectionalLight( 0xFFFFFF, 2 );
        l.position.set(0, 1, 0);
        scene.add(l);

        initPass();
        addControls();

        update();
        animate();
        audio.play();
    }

    function addControls()
    {
        controls = new THREE.TrackballControls( camera );
        // controls.staticMoving = true;
        controls.maxDistance = 200;
        controls.minDistance = 50;
        controls.noRoll = true;
        controls.noPan = true;
        controls.noRotate = true;
        
        controls.dynamicDampingFactor = .15;
        // controls.enabled = false;
        controls.addEventListener( 'change', render );
        document.addEventListener( 'mousedown', onMouseDown, false );
        document.addEventListener( 'mousemove', onMouseMove, false );
        document.addEventListener( 'mouseup', onMouseUp, false );
        
        window.addEventListener("resize", onWindowResize);

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        // stats.domElement.style.display = 'none';
        document.body.appendChild(stats.domElement);
    }

    function update() {
        
        controls.update();

        var time = clock.getElapsedTime() * .05;

        postprocessing['rgbPass'].uniforms[ "angle" ].value = Math.random()*Math.PI;
        postprocessing['rgbPass'].uniforms[ "amount" ].value = rgbParams.amount;

        postprocessing['badtv'].uniforms[ "distortion" ].value = badTVParams.distortion;  
        postprocessing['badtv'].uniforms[ "distortion2" ].value = badTVParams.distortion2;    

        render()
        requestAnimationFrame(update);
    };

    function render() {
        // renderer.render( scene, camera );
        renderPass();
        stats.update();
    }

    //EVENTS
    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.left = -window.innerWidth * 0.5;
        camera.right = window.innerWidth * 0.5;
        camera.top = window.innerHeight * 0.5;
        camera.bottom = -window.innerHeight * 0.5;
        camera.updateProjectionMatrix();
    };

    function onMouseMove( event ) {
        mouse.x = event.pageX - window.innerWidth * .5;
        mouse.y = -event.pageY - window.innerHeight * .5;

        TweenLite.to(mesh.rotation, .5, {
            y: THREE.Math.degToRad(mouse.x*.015), 
            x: THREE.Math.degToRad(-10 + mouse.y*-.01),
            ease: 'easeInOut'
        })
    }

    function onMouseUp(event)
    {
        event.preventDefault();
    }

    function onMouseDown(event)
    {
        event.preventDefault();
    }

// })();