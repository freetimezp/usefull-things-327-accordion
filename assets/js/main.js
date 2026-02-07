const items = document.querySelectorAll(".fx-item");

// close all except active on load
items.forEach((item) => {
    const content = item.querySelector(".fx-content");
    content.style.height = item.classList.contains("active") ? content.scrollHeight + "px" : "0px";
});

items.forEach((item, index) => {
    const header = item.querySelector(".fx-header");
    const content = item.querySelector(".fx-content");

    header.addEventListener("click", () => {
        items.forEach((i) => {
            if (i !== item) {
                i.classList.remove("active");
                i.querySelector(".fx-content").style.height = "0px";
            }
        });

        item.classList.toggle("active");

        content.style.height = item.classList.contains("active") ? content.scrollHeight + "px" : "0px";

        // trigger shader pulse
        targetIntensity = 0.5;
        pulseIndex = index;

        setTimeout(() => {
            targetIntensity = 1.8;
        }, 900);
    });
});

/* =========================
   THREE.JS BACKGROUND
========================= */

const canvas = document.getElementById("fx-bg");

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

/* =========================
   UNIFORMS
========================= */

const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uPhase: { value: 0 },
};

/* =========================
   SHADER
========================= */

const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms,
    vertexShader: `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform vec2 uResolution;
        uniform float uPhase;

        float rand(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            float a = rand(i);
            float b = rand(i + vec2(1.0, 0.0));
            float c = rand(i + vec2(0.0, 1.0));
            float d = rand(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) +
                   (c - a) * u.y * (1.0 - u.x) +
                   (d - b) * u.x * u.y;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution.xy;

            float t = uTime * 0.4 + uPhase;

            float n1 = noise(uv * 6.0 + t);
            float n2 = noise(uv * 12.0 - t);

            float intensity = clamp(uIntensity, 0.0, 4.0);
            float distortion = (n1 + n2) * 0.5 * intensity;

            uv += distortion * vec2(
                sin(t + uv.y * 8.0),
                cos(t + uv.x * 8.0)
            ) * 0.015;

            float glow = smoothstep(0.3, 1.0, distortion);
            glow *= 0.75;

            gl_FragColor = vec4(
                vec3(0.0, 0.55, 0.7),
                glow * 0.18
            );
        }
    `,
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

/* =========================
   SMOOTH INTENSITY SYSTEM
========================= */

let intensity = 0;
let targetIntensity = 0;
let velocity = 0;
let pulseIndex = 0;

/* =========================
   ANIMATION LOOP
========================= */

function animate() {
    uniforms.uTime.value += 0.01;
    uniforms.uPhase.value += 0.002 + pulseIndex * 0.0008;

    // spring smoothing (key part)
    const stiffness = 0.08;
    const damping = 0.85;

    const force = (targetIntensity - intensity) * stiffness;
    velocity = (velocity + force) * damping;
    intensity += velocity;

    uniforms.uIntensity.value = intensity;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

/* =========================
   RESIZE
========================= */

window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});
