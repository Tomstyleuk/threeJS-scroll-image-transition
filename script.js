import * as THREE from './lib/three.module.js'

window.addEventListener(
    "DOMContentLoaded",
    async () => {
        const wrapper = document.querySelector("#webgl");
        const app = new App(wrapper);
        app.init();
        app.render();
    },
    false
);

class App {
    static SIZE = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    static CAMERA_PARAM = {
        fovy: 70,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 1000,
        position: new THREE.Vector3(0, 0, 1),
    };

    static RENDERER_PARAM = {
        clearColor: "#000000",
        width: App.SIZE.width,
        height: App.SIZE.height,
    };


    wrapper
    scene
    camera
    renderer
    geometry
    material
    mesh

    constructor(wrapper) {
        this.wrapper = wrapper;

        this.uniforms = {
            uProgress: { value: 0.0 },
            uTexture1: { value: null },
            uTexture2: { value: null },
            uTexture3: { value: null },
            uResolution: { value: new THREE.Vector2(App.SIZE.width, App.SIZE.height) },
            uTexture: { value: null },
            texResolution: { value: new THREE.Vector2(1, 1) },
            uTextureSize: { value: new THREE.Vector2(1, 1) },
        };

        // Shaders
        this.vertexShader = document.getElementById("vertexShader").textContent;
        this.fragmentShader = document.getElementById("fragmentShader").textContent;

        // Bind
        this.render = this.render.bind(this);
        this.onResize = this.onResize.bind(this);
        window.addEventListener("resize", this.debouncedResize.bind(this), false)
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            App.CAMERA_PARAM.fovy,
            App.CAMERA_PARAM.aspect,
            App.CAMERA_PARAM.near,
            App.CAMERA_PARAM.far
        );
        this.camera.position.copy(App.CAMERA_PARAM.position);

        // Render
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.wrapper,
            antialias: true,
            alpha: true,
        });
        this.renderer.setClearColor(new THREE.Color(App.RENDERER_PARAM.clearColor));
        this.renderer.setSize(App.SIZE.width, App.SIZE.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


        // Loading methods
        this.createMesh();
        this.loadTextures();
        this.setupScrollTrigger();
    }


    /**
     * Create mesh
     */
    createMesh() {
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }


    /**
     * Load textures
     */
    loadTextures() {
        const loader = new THREE.TextureLoader();
        const imagePaths = ['./images/11.webp', './images/12.webp', './images/17.webp'];

        imagePaths.forEach((path, index) => {
            loader.load(
                path,
                (texture) => {
                    const uniformName = `uTexture${index + 1}`;
                    this.uniforms[uniformName].value = texture;

                    // 画像のサイズを取得
                    const image = texture.image;
                    const width = image.width;
                    const height = image.height;

                    // texResolutionとuTextureSizeを更新
                    this.uniforms.texResolution.value.set(width, height);
                    this.uniforms.uTextureSize.value.set(width, height);
                },
                undefined,
                (error) => console.error(`Error loading texture ${path}:`, error)
            );
        });
    }


    /**
     * ScrollTrigger
     */
    setupScrollTrigger() {
        gsap.registerPlugin(ScrollTrigger);

        const sections = document.querySelectorAll('.section');
        sections.forEach((section, index) => {
            gsap.to(this.uniforms.uProgress, {
                value: 1,
                scrollTrigger: {
                    trigger: section,
                    start: "top top",
                    end: "bottom top",
                    scrub: true,
                    onUpdate: (self) => {
                        // 現在のセクションのインデックスと進行度を組み合わせて
                        // 0から3までの値を生成
                        const totalProgress = index + self.progress;
                        // console.log(totalProgress);
                        this.uniforms.uProgress.value = totalProgress;
                    }
                }
            });
        });
    }


    /**
     * Resize
     */
    debouncedResize() {
        clearTimeout(this.resizeTimeout)
        this.resizeTimeout = setTimeout(() => {
            this.onResize()
        }, 100)
    }

    onResize() {
        App.SIZE.width = window.innerWidth;
        App.SIZE.height = window.innerHeight;

        this.camera.aspect = App.SIZE.width / App.SIZE.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(App.SIZE.width, App.SIZE.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Update uResolution
        this.uniforms.uResolution.value.set(App.SIZE.width, App.SIZE.height);
        // console.log('Resized:', App.SIZE.width, 'x', App.SIZE.height);
    }


    /**
     * Render
     */
    render() {
        requestAnimationFrame(this.render);
        this.renderer.render(this.scene, this.camera);
    }
}